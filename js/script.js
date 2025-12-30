document.addEventListener("DOMContentLoaded", () => {
  const DATA_URL = "data/taajuudet.json";
  const tableBody = document.getElementById("table-body");
  const cardContainer = document.getElementById("card-container");
  const unitSelect = document.getElementById("unit");
  const searchInput = document.getElementById("search");
  const searchButton = document.getElementById("search-button");
  const resetButton = document.getElementById("reset-button");
  let originalData = [];

  // Helper to show toast notifications
  function showToast(message, type = 'info', delay = 3000) {
    const toastContainer = window.innerWidth < 768 
      ? document.querySelector('.toast-container.translate-middle-x')
      : document.querySelector('.toast-container.end-0');
    
    const toastId = `toast-${Date.now()}`;
    const iconMap = {
      'success': { icon: 'check-circle-fill', bgClass: 'text-bg-success' },
      'info': { icon: 'info-fill', bgClass: 'text-bg-info' }
    };
    const config = iconMap[type] || iconMap['info'];

    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center ${config.bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <svg class="bi me-2" width="16" height="16" role="img"><use xlink:href="#${config.icon}"/></svg>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
      autohide: true,
      delay: delay 
    });
    toast.show();
    
    // Remove from DOM after hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  // Helper to show error alert below search controls
  function showErrorAlert(message) {
    const errorContainer = document.getElementById('error-alert-container');
    const alertHTML = `
      <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-3" role="alert">
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Error:">
          <use xlink:href="#exclamation-triangle-fill"/>
        </svg>
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    errorContainer.innerHTML = alertHTML;
  }

  // Show loading toast
  showToast(window.translations?.status_loading || 'Ladataan dataa...', 'info', 2000);

  fetch(DATA_URL)
    .then(response => response.json())
    .then(json => {
      originalData = json.value;
      renderData(originalData);
      showToast(window.translations?.status_success || 'Datan haku onnistui!', 'success', 3000);
    })
    .catch(error => {
      console.error("Virhe haettaessa dataa:", error);
      showErrorAlert(window.translations?.status_error || 'Datan haku epäonnistui.');
    });

  fetch('data/metadata.json')
    .then(res => res.json())
    .then(meta => {
      const formatted = new Date(meta.last_updated).toLocaleString('fi-FI');
      const label = window.translations?.data_updated || "Päivitetty";
      showToast(`${label}: ${formatted}`, 'info', 5000);
  });

  // Render both table (desktop) and cards (mobile)
  function renderData(data) {
    renderTable(data);
    renderCards(data);
  }

  function renderTable(data) {
    const grouped = {};
    data.forEach(item => {
      const bandKey = `${item.Frequency_band_lower_limit} – ${item.Frequency_band_upper_limit}`;
      if (!grouped[bandKey]) {
        grouped[bandKey] = [];
      }
      grouped[bandKey].push(item);
    });

    let html = "";

    for (const band in grouped) {
      const group = grouped[band];
      const rowspan = group.length;

      const bandInfo = `
        <strong>${band}</strong><br>
        <span class="text-muted">${group[0].Services_in_Finland || "-"}</span>
      `;

      group.forEach((item, index) => {
        const subband = `${item.Sub_band_lower_limit} – ${item.Sub_band_upper_limit}`;
        const width = item.Sub_band_width ? ` (${item.Sub_band_width})` : "";
        const usage = item.Sub_band_usage || "";

        const subbandInfo = `
          <p>${subband}${width}</p><br>
          ${usage}
        `;

        const traffic = [
          item.Mode_of_traffic,
          item.Class_of_station,
          item.Direction,
          item.Transmitter_power ? `${item.Transmitter_power} W` : "",
          item.Bandwidth || "",
        ].filter(Boolean).join(" ");

        const note = item.Comment || "-";

        html += `
          <tr>
            ${index === 0 ? `<td rowspan="${rowspan}" class="align-top">${bandInfo}</td>` : ""}
            <td>${subbandInfo}</td>
            <td>${traffic}</td>
            <td>${note}</td>
          </tr>
        `;
      });
    }

    tableBody.innerHTML = html;
  }

  // Mobile view: Bootstrap Accordion for reliable mobile rendering
  function renderCards(data) {
    const t = window.translations || {};
    const labelBand = t.card_band || "Taajuusalue";
    const labelService = t.card_service || "Käyttö Suomessa";
    const labelUsage = t.card_usage || "Käyttö";
    const labelSubband = t.card_subband || "Alikaista";
    const labelWidth = t.card_width || "Leveys";
    const labelTraffic = t.card_traffic || "Liikennemuoto";
    const labelNote = t.card_note || "Huomautukset";

    const grouped = {};
    data.forEach(item => {
      const bandKey = `${item.Frequency_band_lower_limit} – ${item.Frequency_band_upper_limit}`;
      if (!grouped[bandKey]) grouped[bandKey] = [];
      grouped[bandKey].push(item);
    });

    let html = '<div class="accordion accordion-flush" id="freqAccordion">';
    let itemIndex = 0;

    Object.keys(grouped).forEach(bandKey => {
      const group = grouped[bandKey];
      const service = group[0].Services_in_Finland || "-";

      group.forEach(item => {
        const subband = `${item.Sub_band_lower_limit} – ${item.Sub_band_upper_limit}`;
        const width = item.Sub_band_width || "-";
        const usage = item.Sub_band_usage || "-";
        const traffic = [
          item.Mode_of_traffic,
          item.Class_of_station,
          item.Direction,
          item.Transmitter_power ? `${item.Transmitter_power} W` : "",
          item.Bandwidth || "",
        ].filter(Boolean).join(" · ") || "-";
        const note = item.Comment || "-";

        const collapseId = `collapse${itemIndex}`;
        const headerId = `heading${itemIndex}`;
        itemIndex++;

        html += `
          <div class="accordion-item border border-secondary rounded mb-2">
            <h3 class="accordion-header" id="${headerId}">
              <button class="accordion-button collapsed bg-gradient text-white" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#${collapseId}" 
                      aria-expanded="false" aria-controls="${collapseId}"
                      style="background: linear-gradient(135deg, #5e3b99 0%, #4b3b70 100%);">
                <div class="w-100">
                  <div class="fw-bold fs-6">${bandKey}</div>
                  <div class="small fst-italic opacity-90">${service}</div>
                  <div class="small mt-1">${usage}</div>
                </div>
              </button>
            </h3>
            <div id="${collapseId}" class="accordion-collapse collapse" 
                 aria-labelledby="${headerId}" data-bs-parent="#freqAccordion">
              <div class="accordion-body bg-light">
                <table class="table table-sm table-borderless mb-0">
                  <tbody>
                    <tr><th class="text-white small">${labelBand}:</th><td>${bandKey}</td></tr>
                    <tr><th class="text-white small">${labelService}:</th><td>${service}</td></tr>
                    <tr><th class="text-white small">${labelSubband}:</th><td>${subband}</td></tr>
                    <tr><th class="text-white small">${labelWidth}:</th><td>${width}</td></tr>
                    <tr><th class="text-white small">${labelUsage}:</th><td>${usage}</td></tr>
                    <tr><th class="text-white small">${labelTraffic}:</th><td>${traffic}</td></tr>
                    <tr><th class="text-white small">${labelNote}:</th><td>${note}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      });
    });

    html += '</div>';
    cardContainer.innerHTML = html;
  }

  function filterTable() {
    const query = searchInput.value.trim();
    const selectedUnit = unitSelect.value;
    const queryNumber = parseFloat(query);
    const queryHz = selectedUnit && !isNaN(queryNumber)
      ? (() => {
          switch (selectedUnit) {
            case 'kHz': return queryNumber * 1e3;
            case 'MHz': return queryNumber * 1e6;
            case 'GHz': return queryNumber * 1e9;
            default: return null;
          }
        })()
      : null;

    const filtered = originalData.filter(item => {
      const lower = item.Sub_band_lower_limit__Hz_;
      const upper = item.Sub_band_upper_limit__Hz_;
      const matchByFreq = queryHz !== null && lower !== null && upper !== null
        ? queryHz >= lower && queryHz <= upper
        : false;

      const text = (
        item.Services_in_Finland +
        item.Sub_band_usage +
        item.Comment
      ).toLowerCase();
      const textMatch = queryHz === null && text.includes(query.toLowerCase());

      return matchByFreq || textMatch;
    });

    renderData(filtered);
  }

  function resetTable() {
    searchInput.value = "";
    renderData(originalData);
  }

  searchButton.addEventListener("click", filterTable);
  resetButton.addEventListener("click", resetTable);

  // ===== Info-nappulan toiminnallisuus =====
  const toggleButton = document.getElementById("info-toggle");
  const infoContent = document.getElementById("info-content");

  if (toggleButton && infoContent) {
    toggleButton.addEventListener("click", () => {
      // Toggle both d-none and d-md-block to work correctly on all screen sizes
      if (infoContent.classList.contains("d-none")) {
        infoContent.classList.remove("d-none");
        infoContent.classList.add("d-block");
        toggleButton.textContent = window.translations?.info_button_hide || "Piilota lisätiedot";
      } else {
        infoContent.classList.remove("d-block");
        infoContent.classList.add("d-none");
        toggleButton.textContent = window.translations?.info_button || "Näytä lisätiedot";
      }
    });
  }
});
