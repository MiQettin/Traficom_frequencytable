document.addEventListener("DOMContentLoaded", () => {
  const DATA_URL = "data/taajuudet.json"; // Vaihda tähän myös proxy-URL jos käytät sitä suoraan
  const tableBody = document.getElementById("table-body");
  const statusMessage = document.getElementById("status-message");
  const unitSelect = document.getElementById("unit");
  const searchInput = document.getElementById("search");
  const searchButton = document.getElementById("search-button");
  const resetButton = document.getElementById("reset-button");
  let originalData = [];

  fetch(DATA_URL) /* Ei päivity tällä hetkellä, kun kieli vaihdetaan -> Selvitä myöhemmin. */
    .then(response => response.json())
    .then(json => {
      originalData = json.value; // tärkeä muutos!
      renderTable(originalData);
      statusMessage.textContent = window.translations?.status_success || "Datan haku onnistui!"; /* Haetaan kielitiedostosta globaalien muuttujien avulla -> Asetettu lang.js */
 /* Haetaan kielitiedosta viestit */
      statusMessage.style.color = "red";
    })
    .catch(error => {
      console.error("Virhe haettaessa dataa:", error);
      statusMessage.textContent = window.translations?.status_error || "Datan haku epäonnistui.";
      statusMessage.style.color = "red";
    });

function renderTable(data) {
  const tableBody = document.getElementById("table-body");

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

    html += `
      <tr class="table-primary fw-bold">
        <td colspan="3">${band}</td>
      </tr>
    `;

    group.forEach(item => {
      const subband = `${item.Sub_band_lower_limit} – ${item.Sub_band_upper_limit}`;
      const width = item.Sub_band_width ? ` (${item.Sub_band_width})` : "";
      const usage = item.Sub_band_usage || "";
      const service = item.Services_in_Finland || "-";

      const leftCol = `
        <strong>${subband}${width}</strong><br>
        ${usage}<br>
        <span class="text-muted">${service}</span>
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
          <td>${leftCol}</td>
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
              case 'kHz': return queryNumber * 1e3; /* Tiedot datassa hertseinä -> kymmenpotensseilla nosto */
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
});
