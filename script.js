async function getCryptoPrices() {
  const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
  const data = await response.json();
  
  document.getElementById("btc-price").innerText = "BTC: $" + data.bitcoin.usd;
  document.getElementById("eth-price").innerText = "ETH: $" + data.ethereum.usd;
}

// Refresh every 5 seconds
setInterval(getCryptoPrices, 5000);
getCryptoPrices();