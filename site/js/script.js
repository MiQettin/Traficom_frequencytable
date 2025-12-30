document.addEventListener("DOMContentLoaded", () => {
  const DATA_URL = "data/taajuudet.json";
  const tableBody = document.getElementById("table-body");
  const cardContainer = document.getElementById("card-container");
  const statusMessage = document.getElementById("status-message");
  const unitSelect = document.getElementById("unit");
  const searchInput = document.getElementById("search");
  const searchButton = document.getElementById("search-button");
  const resetButton = document.getElementById("reset-button");
  let originalData = [];

  fetch(DATA_URL)
    .then(response => response.json())
    .then(json => {
      originalData = json.value;
      renderData(originalData);
      statusMessage.className = "alert alert-success alert-dismissible fade show d-flex align-items-center mb-2";
      statusMessage.innerHTML = `
        <svg class="bi flex-shrink-0 me-2" width="20" height="20" role="img" aria-label="Success:"><use xlink:href="#check-circle-fill"/></svg>
        <span>${window.translations?.status_success || "Datan haku onnistui!"}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(statusMessage);
        alert.close();
      }, 3000);
    })
    .catch(error => {
      console.error("Virhe haettaessa dataa:", error);
      statusMessage.className = "alert alert-danger alert-dismissible fade show d-flex align-items-center mb-2";
      statusMessage.innerHTML = `
        <svg class="bi flex-shrink-0 me-2" width="20" height="20" role="img" aria-label="Error:"><use xlink:href="#exclamation-triangle-fill"/></svg>
        <span>${window.translations?.status_error || "Datan haku epäonnistui."}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      // Error stays visible (user must close manually)
    });

  fetch('data/metadata.json')
    .then(res => res.json())
    .then(meta => {
      const formatted = new Date(meta.last_updated).toLocaleString('fi-FI');
      const label = window.translations?.data_updated || "Päivitetty";
      const timestampEl = document.getElementById('data-timestamp');
      const timestampText = document.getElementById('data-timestamp-text');
      timestampText.textContent = `${label}: ${formatted}`;
      timestampEl.style.display = 'block';
      // Auto-hide timestamp after 5 seconds
      setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(timestampEl);
        alert.close();
      }, 5000);
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
                    <tr><th class="text-muted small">${labelBand}:</th><td>${bandKey}</td></tr>
                    <tr><th class="text-muted small">${labelService}:</th><td>${service}</td></tr>
                    <tr><th class="text-muted small">${labelSubband}:</th><td>${subband}</td></tr>
                    <tr><th class="text-muted small">${labelWidth}:</th><td>${width}</td></tr>
                    <tr><th class="text-muted small">${labelUsage}:</th><td>${usage}</td></tr>
                    <tr><th class="text-muted small">${labelTraffic}:</th><td>${traffic}</td></tr>
                    <tr><th class="text-muted small">${labelNote}:</th><td>${note}</td></tr>
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
