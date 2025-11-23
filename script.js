import { Connection, PublicKey } from "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.91.2/+esm";
import {
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction
} from "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.91.2/+esm";

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

async function sendSPL(sender, recipient, mint, amount) {
    const mintPk = new PublicKey(mint);
    const recipientPk = new PublicKey(recipient);

    const spl = await import("https://cdn.jsdelivr.net/npm/@solana/spl-token@0.4.0/+esm");

    const tx = new Transaction().add(
        spl.createTransferInstruction(
            await spl.getAssociatedTokenAddress(mintPk, sender),
            await spl.getAssociatedTokenAddress(mintPk, recipientPk),
            sender,
            amount
        )
    );

    return await wallet.sendTransaction(tx, connection);
}

document.getElementById("send-sol-btn").onclick = async () => {
    const recipient = document.getElementById("send-address").value;
    const amount = parseFloat(document.getElementById("send-amount").value);
    const sig = await sendSOL(wallet.publicKey, recipient, amount);
    document.getElementById("send-status").innerHTML = "Sent! Tx: " + sig;
};

const RPC = "https://rpc.ankr.com/solana";
const connection = new Connection(RPC);

async function loadBalances(pubkey) {
    const balancesBox = document.getElementById("balances");
    balancesBox.innerHTML = "Loading...";

    // Get SOL balance
    const sol = await connection.getBalance(pubkey) / 1e9;

    // Get SPL token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    });

    let html = `<p><b>SOL:</b> ${sol.toFixed(4)}</p>`;

    tokenAccounts.value.forEach(acc => {
        const info = acc.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.uiAmount;

        if (amount > 0) {
            html += `<p><b>${mint}:</b> ${amount}</p>`;
        }
    });

    balancesBox.innerHTML = html;

// DOM Ready (faster than window.onload)
document.addEventListener("DOMContentLoaded", () => {

window.Jupiter.init({
    displayMode: "integrated",
    integratedTargetId: "integrated-terminal",
    endpoint: "https://rpc.ankr.com/solana",
    enableWallet: true,
    strictTokenList: false
});


});

// Sidebar open
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
}

// Sidebar close
function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}

// Mobile nav toggle
function openNav() {
    const x = document.getElementById("navDemo");
    x.classList.toggle("w3-show");
}
walletBtn.addEventListener("click", async () => {
    await wallet.connect();
    loadBalances(wallet.publicKey);
});
async function jupiterSwap(inputMint, outputMint, amount, userPublicKey) {
    const quoteUrl =
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`;

    const quote = await (await fetch(quoteUrl)).json();

    const swapUrl = "https://quote-api.jup.ag/v6/swap";
    const swapRequest = {
        quoteResponse: quote,
        userPublicKey: userPublicKey.toBase58(),
        wrapAndUnwrapSol: true
    };

    const swapResponse = await (await fetch(swapUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swapRequest)
    })).json();

    const tx = swapResponse.swapTransaction;

    const swapTx = Transaction.from(Buffer.from(tx, "base64"));
    const signature = await wallet.sendTransaction(swapTx, connection);

    return signature;
}

document.getElementById("swap-btn").onclick = async () => {
    const fromMint = document.getElementById("swap-from-mint").value;
    const toMint = document.getElementById("swap-to-mint").value;
    const uiAmount = parseFloat(document.getElementById("swap-amount").value);

    const sig = await jupiterSwap(
        fromMint,
        toMint,
        uiAmount * 10 ** 6, // if token has 6 decimals (most SPL)
        wallet.publicKey
    );

    document.getElementById("swap-result").innerHTML =
        "Swap complete! Tx: " + sig;
};

}