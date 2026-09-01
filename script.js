document.addEventListener('DOMContentLoaded', () => {
  const assetGrid = document.getElementById('assetGrid');
  const marketTableBody = document.getElementById('marketTableBody');
  const chartCanvas = document.getElementById('marketCanvas');
  const chartTitle = document.getElementById('marketChartTitle');
  const chartButtons = document.querySelectorAll('.chart-toggle button');
  const watchlist = document.getElementById('watchlist');
  const marketCapStat = document.getElementById('marketCapStat');
  const volumeStat = document.getElementById('volumeStat');
  const dominanceStat = document.getElementById('dominanceStat');
  const marketSearch = document.getElementById('marketSearch');
  const filterButtons = document.querySelectorAll('.filter-chip');

  if (!assetGrid && !marketTableBody && !chartCanvas) {
    return;
  }

  const marketConfig = {
    ids: [
      'bitcoin',
      'ethereum',
      'ripple',
      'solana',
      'dogecoin',
      'cardano',
      'binancecoin',
      'tron',
      'tether',
      'usd-coin'
    ],
    currency: 'usd',
    refreshMs: 30000,
    selectedSymbol: 'BTC',
    selectedFilter: 'all',
    searchText: ''
  };

  let assets = [];

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '$0.00';
    }

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value >= 1000 ? 2 : value >= 1 ? 4 : 6
    }).format(value);

    return formatted;
  };

  const formatCompact = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(value);
  };

  const getPriceChangeClass = (value) => (value >= 0 ? 'trend-up' : 'trend-down');

  function getFilteredAssets() {
    const normalized = marketConfig.searchText.trim().toLowerCase();

    return assets.filter((asset) => {
      const symbol = asset.symbol.toLowerCase();
      const name = asset.name.toLowerCase();
      const matchesSearch = !normalized || symbol.includes(normalized) || name.includes(normalized);
      const matchesFilter =
        marketConfig.selectedFilter === 'all' ||
        (marketConfig.selectedFilter === 'layer1' && ['btc', 'eth', 'sol', 'ada', 'dot', 'avax'].includes(symbol)) ||
        (marketConfig.selectedFilter === 'meme' && ['doge', 'pepe', 'shib'].includes(symbol)) ||
        (marketConfig.selectedFilter === 'stable' && ['usdt', 'usdc'].includes(symbol));

      return matchesSearch && matchesFilter;
    });
  }

  function renderAssetGrid() {
    if (!assetGrid) return;

    const filteredAssets = getFilteredAssets();

    assetGrid.innerHTML = filteredAssets
      .slice(0, 6)
      .map((asset) => {
        const change = asset.price_change_percentage_24h ?? 0;
        return `
          <button class="asset-card ${asset.symbol.toUpperCase() === marketConfig.selectedSymbol ? 'is-selected' : ''}" type="button" data-symbol="${asset.symbol.toUpperCase()}">
            <span class="coin-rank">#${asset.market_cap_rank || '--'}</span>
            <h4>${asset.symbol.toUpperCase()}</h4>
            <p>${asset.name}</p>
            <strong>${formatCurrency(asset.current_price)}</strong>
            <small class="${getPriceChangeClass(change)}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</small>
          </button>
        `;
      })
      .join('');

    if (!filteredAssets.length) {
      assetGrid.innerHTML = `
        <div class="asset-card asset-card-fallback">
          <h4>No matches</h4>
          <p>Try another market filter or symbol.</p>
        </div>
      `;
    }

    assetGrid.querySelectorAll('.asset-card').forEach((card) => {
      card.addEventListener('click', () => {
        const symbol = card.dataset.symbol;
        setSelectedSymbol(symbol);
      });
    });
  }

  function renderWatchlist() {
    if (!watchlist) return;

    const topWatch = assets.slice(0, 4);
    watchlist.innerHTML = topWatch
      .map((asset) => {
        const change = asset.price_change_percentage_24h ?? 0;
        return `
          <li>
            <div>
              <strong>${asset.symbol.toUpperCase()}</strong><br />
              <small>${asset.name}</small>
            </div>
            <div>
              <strong>${formatCurrency(asset.current_price)}</strong><br />
              <small class="${getPriceChangeClass(change)}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</small>
            </div>
          </li>
        `;
      })
      .join('');
  }

  function renderMarketTable() {
    if (!marketTableBody) return;

    const filteredAssets = getFilteredAssets();

    marketTableBody.innerHTML = filteredAssets
      .slice(0, 8)
      .map((asset, index) => {
        const change = asset.price_change_percentage_24h ?? 0;
        return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <span class="asset-cell">
                <span class="asset-badge">${asset.symbol.toUpperCase().slice(0, 1)}</span>
                <span>
                  <strong>${asset.symbol.toUpperCase()}</strong><br />
                  <small>${asset.name}</small>
                </span>
              </span>
            </td>
            <td>${formatCurrency(asset.current_price)}</td>
            <td class="${getPriceChangeClass(change)}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</td>
            <td>${formatCompact(asset.total_volume)}</td>
            <td>${formatCompact(asset.market_cap)}</td>
          </tr>
        `;
      })
      .join('');
  }

  function renderChart() {
    if (!chartCanvas || !assets.length) return;

    const asset = assets.find((item) => item.symbol.toUpperCase() === marketConfig.selectedSymbol) || assets[0];
    const ctx = chartCanvas.getContext('2d');
    const values = asset?.sparkline_in_7d?.price || Array.from({ length: 30 }, (_, index) => Math.sin(index / 3) * 120 + 25000 + index * 55);

    const width = chartCanvas.width;
    const height = chartCanvas.height;
    const padding = 24;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, width, height);
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, 'rgba(212, 175, 55, 0.10)');
    background.addColorStop(1, 'rgba(0, 0, 0, 0.20)');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d4af37';
    ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
    ctx.shadowBlur = 12;

    values.forEach((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.shadowBlur = 0;

    const lastX = padding + ((values.length - 1) / (values.length - 1)) * (width - padding * 2);
    const lastY = height - padding - ((values[values.length - 1] - min) / range) * (height - padding * 2);

    ctx.beginPath();
    ctx.fillStyle = '#d4af37';
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5deb3';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText(`${asset.symbol.toUpperCase()} ${formatCurrency(asset.current_price)}`, padding, 24);
  }

  function setSelectedSymbol(symbol) {
    marketConfig.selectedSymbol = symbol;
    if (chartTitle) {
      const asset = assets.find((item) => item.symbol.toUpperCase() === symbol) || assets[0];
      chartTitle.textContent = `${asset.symbol.toUpperCase()} / USD live market`;
    }

    chartButtons.forEach((button) => {
      const active = button.dataset.chartSymbol === symbol;
      button.classList.toggle('is-active', active);
    });

    renderAssetGrid();
    renderMarketTable();
    renderChart();
  }

  async function fetchLiveMarketData() {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${marketConfig.currency}&ids=${marketConfig.ids.join(',')}&order=market_cap_desc&per_page=12&page=1&sparkline=true&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error('Unable to load market data');
      }

      const data = await response.json();
      assets = data.map((coin) => ({
        ...coin,
        symbol: coin.symbol.toUpperCase(),
        sparkline_in_7d: coin.sparkline_in_7d || { price: Array.from({ length: 30 }, (_, index) => Math.sin(index / 2) * 0.02 + coin.current_price) }
      }));

      if (!assets.length) {
        return;
      }

      if (!assets.some((item) => item.symbol === marketConfig.selectedSymbol)) {
        marketConfig.selectedSymbol = assets[0].symbol;
      }

      const totalMarketCap = assets.reduce((sum, asset) => sum + (asset.market_cap || 0), 0);
      const totalVolume = assets.reduce((sum, asset) => sum + (asset.total_volume || 0), 0);
      const bitcoinShare = assets.find((asset) => asset.symbol === 'BTC')?.market_cap;
      const dominance = totalMarketCap && bitcoinShare ? (bitcoinShare / totalMarketCap) * 100 : 0;

      if (marketCapStat) marketCapStat.textContent = formatCompact(totalMarketCap);
      if (volumeStat) volumeStat.textContent = formatCompact(totalVolume);
      if (dominanceStat) dominanceStat.textContent = `BTC ${dominance.toFixed(0)}%`;

      renderWatchlist();
      renderAssetGrid();
      renderMarketTable();
      setSelectedSymbol(marketConfig.selectedSymbol);
    } catch (error) {
      console.error('Market data error:', error);
      if (assetGrid) {
        assetGrid.innerHTML = `
          <div class="asset-card asset-card-fallback">
            <h4>Market offline</h4>
            <p>Live crypto data is temporarily unavailable.</p>
          </div>
        `;
      }
    }
  }

  chartButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const symbol = button.dataset.chartSymbol;
      if (symbol) {
        setSelectedSymbol(symbol);
      }
    });
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      marketConfig.selectedFilter = button.dataset.filter || 'all';
      filterButtons.forEach((chip) => chip.classList.toggle('is-active', chip === button));
      renderAssetGrid();
      renderMarketTable();
    });
  });

  if (marketSearch) {
    marketSearch.addEventListener('input', (event) => {
      marketConfig.searchText = event.target.value;
      renderAssetGrid();
      renderMarketTable();
    });
  }

  fetchLiveMarketData();
  window.setInterval(fetchLiveMarketData, marketConfig.refreshMs);
});

  document.addEventListener('DOMContentLoaded', () => {
    const bankAccountForm = document.getElementById('bankAccountForm');
    const cardForm = document.getElementById('cardForm');
    const addBankAccountBtn = document.getElementById('addBankAccountBtn');
    const addCardBtn = document.getElementById('addCardBtn');
    const topAddBankBtn = document.getElementById('topAddBankBtn');
    const paymentStatus = document.getElementById('paymentStatus');

    if (!bankAccountForm || !cardForm || !addBankAccountBtn || !addCardBtn) {
      return;
    }

    const paymentForms = [bankAccountForm, cardForm];
    const showPaymentForm = (form) => {
      paymentForms.forEach((paymentForm) => {
        paymentForm.hidden = paymentForm !== form;
      });
      paymentStatus.textContent = '';
      form.querySelector('input, select').focus();
    };

    addBankAccountBtn.addEventListener('click', () => showPaymentForm(bankAccountForm));
    addCardBtn.addEventListener('click', () => showPaymentForm(cardForm));
    if (topAddBankBtn) {
      topAddBankBtn.addEventListener('click', () => showPaymentForm(bankAccountForm));
    }

    document.querySelectorAll('[data-close-form]').forEach((closeButton) => {
      closeButton.addEventListener('click', () => {
        document.getElementById(closeButton.dataset.closeForm).hidden = true;
      });
    });

    [bankAccountForm, cardForm].forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        form.hidden = true;
        form.reset();
        paymentStatus.textContent = form === bankAccountForm
          ? 'Bank account added. It is ready for verification.'
          : 'Card added. It is ready for verification.';
      });
    });

    const depositBtn = document.getElementById('depositBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const transferBtn = document.getElementById('transferBtn');
    const sendBtn = document.getElementById('sendBtn');
    const billsBtn = document.getElementById('billsBtn');

    const transactionMessages = {
      deposit: 'Opening Deposit form...\n\nYou can add funds from:\n- Bank Transfer\n- Credit/Debit Card\n- Crypto Transfer',
      withdraw: 'Opening Withdrawal form...\n\nSelect destination:\n- Bank Account\n- Credit/Debit Card\n- Crypto Wallet',
      transfer: 'Opening Transfer form...\n\nTransfer between:\n- Your Wallets\n- Trading Accounts\n- Vault Storage',
      send: 'Opening Send form...\n\nSend funds to:\n- Contacts\n- Beneficiaries\n- Email Address',
      bills: 'Opening Bill Payment form...\n\nPay:\n- Utility Bills\n- Electricity\n- Data Services\n- Other Services'
    };

    if (depositBtn) {
      depositBtn.addEventListener('click', () => {
        alert(transactionMessages.deposit);
      });
    }

    if (withdrawBtn) {
      withdrawBtn.addEventListener('click', () => {
        alert(transactionMessages.withdraw);
      });
    }

    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        alert(transactionMessages.transfer);
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        alert(transactionMessages.send);
      });
    }

    if (billsBtn) {
      billsBtn.addEventListener('click', () => {
        alert(transactionMessages.bills);
      });
    }
  });
