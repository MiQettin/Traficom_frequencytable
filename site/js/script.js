document.addEventListener("DOMContentLoaded", () => {
  const DATA_URL = "data/taajuudet.json";
  const tableBody = document.getElementById("table-body");
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
      renderTable(originalData);
      statusMessage.textContent = window.translations?.status_success || "Datan haku onnistui!";
      statusMessage.style.color = "red";
    })
    .catch(error => {
      console.error("Virhe haettaessa dataa:", error);
      statusMessage.textContent = window.translations?.status_error || "Datan haku epäonnistui.";
      statusMessage.style.color = "red";
    });

  fetch('data/metadata.json')
    .then(res => res.json())
    .then(meta => {
      const formatted = new Date(meta.last_updated).toLocaleString('fi-FI');
      document.getElementById('data-timestamp').textContent = `Updated: ${formatted}`;
  });

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

    renderTable(filtered);
  }

  function resetTable() {
    searchInput.value = "";
    renderTable(originalData);
  }

  searchButton.addEventListener("click", filterTable);
  resetButton.addEventListener("click", resetTable);

  // ===== Info-nappulan toiminnallisuus =====
  const toggleButton = document.getElementById("info-toggle");
  const infoContent = document.getElementById("info-content");

  if (toggleButton && infoContent) {
    toggleButton.addEventListener("click", () => {
      infoContent.classList.toggle("d-none");
      const isVisible = !infoContent.classList.contains("d-none");
      toggleButton.textContent = isVisible
        ? window.translations?.info_button_hide || "Piilota lisätiedot"
        : window.translations?.info_button || "Näytä lisätiedot";
    });
  }
});
