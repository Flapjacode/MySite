// -----------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction
} from "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.91.2/+esm";

import {
    createTransferInstruction,
    getAssociatedTokenAddress
} from "https://cdn.jsdelivr.net/npm/@solana/spl-token@0.4.0/+esm";

// -----------------------------------------------------------
// GLOBALS
// -----------------------------------------------------------
const RPC = "https://rpc.ankr.com/solana";
const connection = new Connection(RPC);

let wallet = null; // Jupiter wallet object
let walletModal = null;

// When DOM is ready
document.addEventListener("DOMContentLoaded", async () => {

    // -----------------------------
    // Init Jupiter Wallets Modal
    // -----------------------------
    const { WalletsModal } = window.JupiterWallets;

    walletModal = new WalletsModal({
        onConnect: (publicKey, newWallet) => {
            wallet = newWallet;
            const short = publicKey.toString().slice(0, 4) + "..." + publicKey.toString().slice(-4);
            document.getElementById("wallet-btn").innerText = short;
            loadBalances(publicKey);
        }
    });

    // Connect wallet button
    document.getElementById("wallet-btn").addEventListener("click", () => {
        walletModal.open();
    });

    // -----------------------------
    // Initialize Jupiter Terminal
    // -----------------------------
    window.Jupiter.init({
        displayMode: "integrated",
        integratedTargetId: "integrated-terminal",
        endpoint: RPC,
        enableWallet: true,
        strictTokenList: false
    });

});


// -----------------------------------------------------------
// LOAD BALANCES
// -----------------------------------------------------------
async function loadBalances(pubkey) {
    const box = document.getElementById("balances");
    box.innerHTML = "Loading...";

    // SOL balance
    const sol = await connection.getBalance(pubkey);
    let html = `<p><b>SOL:</b> ${(sol / 1e9).toFixed(4)}</p>`;

    // Token balances
    const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    });

    accounts.value.forEach(acc => {
        const info = acc.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.uiAmount;
        if (amount > 0) {
            html += `<p><b>${mint}:</b> ${amount}</p>`;
        }
    });

    box.innerHTML = html;
}


// -----------------------------------------------------------
// SEND SOL
// -----------------------------------------------------------
async function sendSOL(sender, recipient, amount) {
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: new PublicKey(recipient),
            lamports: amount * 1e9
        })
    );

    return await wallet.sendTransaction(tx, connection);
}

document.getElementById("send-sol-btn").onclick = async () => {
    if (!wallet) return alert("Connect wallet first!");

    const recipient = document.getElementById("send-address").value;
    const amount = parseFloat(document.getElementById("send-amount").value);

    const sig = await sendSOL(wallet.publicKey, recipient, amount);

    document.getElementById("send-status").innerHTML =
        `SOL Sent! Tx: <a target="_blank" href="https://solscan.io/tx/${sig}">${sig}</a>`;
};


// -----------------------------------------------------------
// SEND SPL TOKEN
// -----------------------------------------------------------
async function sendSPL(sender, recipient, mint, amount) {
    const mintPk = new PublicKey(mint);
    const recipientPk = new PublicKey(recipient);

    const ataSender = await getAssociatedTokenAddress(mintPk, sender);
    const ataRecipient = await getAssociatedTokenAddress(mintPk, recipientPk);

    const tx = new Transaction().add(
        createTransferInstruction(
            ataSender,
            ataRecipient,
            sender,
            amount
        )
    );

    return await wallet.sendTransaction(tx, connection);
}

document.getElementById("send-spl-btn").onclick = async () => {
    if (!wallet) return alert("Connect wallet first!");

    const recipient = document.getElementById("send-address").value;
    const amount = parseFloat(document.getElementById("send-amount").value);
    const mint = prompt("Enter SPL Token Mint Address:");

    const sig = await sendSPL(wallet.publicKey, recipient, mint, amount);

    document.getElementById("send-status").innerHTML =
        `SPL Sent! Tx: <a target="_blank" href="https://solscan.io/tx/${sig}">${sig}</a>`;
};


// -----------------------------------------------------------
// JUPITER CUSTOM SWAP
// -----------------------------------------------------------
async function jupiterSwap(inputMint, outputMint, uiAmount, userPk) {

    // Quote
    const quoteUrl =
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${uiAmount}&slippageBps=50`;

    const quote = await (await fetch(quoteUrl)).json();

    // Build swap request
    const swapResponse = await (await fetch(
        "https://quote-api.jup.ag/v6/swap",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quoteResponse: quote,
                userPublicKey: userPk.toBase58(),
                wrapAndUnwrapSol: true
            })
        }
    )).json();

    // Decode transaction
    const tx = Transaction.from(Buffer.from(swapResponse.swapTransaction, "base64"));

    // Send transaction
    return await wallet.sendTransaction(tx, connection);
}

document.getElementById("swap-btn").onclick = async () => {
    if (!wallet) return alert("Connect wallet first!");

    const mintFrom = document.getElementById("swap-from-mint").value;
    const mintTo = document.getElementById("swap-to-mint").value;
    const amount = parseFloat(document.getElementById("swap-amount").value);

    // Assume token has 6 decimals (most SPL tokens)
    const realAmount = Math.floor(amount * 10 ** 6);

    const sig = await jupiterSwap(
        mintFrom,
        mintTo,
        realAmount,
        wallet.publicKey
    );

    document.getElementById("swap-result").innerHTML =
        `Swap Complete! Tx: <a target="_blank" href="https://solscan.io/tx/${sig}">${sig}</a>`;
};


// -----------------------------------------------------------
// UI functions (sidebar, mobile nav)
// -----------------------------------------------------------
window.w3_open = function () {
    document.getElementById("mySidebar").style.display = "block";
};
window.w3_close = function () {
    document.getElementById("mySidebar").style.display = "none";
};
window.openNav = function () {
    document.getElementById("navDemo").classList.toggle("w3-show");
};
