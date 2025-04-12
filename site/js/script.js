document.addEventListener("DOMContentLoaded", () => {
  const DATA_URL = "data/taajuudet.json"; // Vaihda tähän myös proxy-URL jos käytät sitä suoraan
  const tableBody = document.getElementById("table-body");
  const statusMessage = document.getElementById("status-message");
  const searchInput = document.getElementById("search");
  const searchButton = document.getElementById("search-button");
  const resetButton = document.getElementById("reset-button");
  let originalData = [];

  fetch(DATA_URL)
    .then(response => response.json())
    .then(json => {
      originalData = json.value; // tärkeä muutos!
      renderTable(originalData);
      statusMessage.textContent = "Datan haku onnistui!";
      statusMessage.style.color = "green";
    })
    .catch(error => {
      console.error("Virhe haettaessa dataa:", error);
      statusMessage.textContent = "Datan haku epäonnistui.";
      statusMessage.style.color = "red";
    });

    function renderTable(data) {
      let html = "";
      data.forEach(item => {
        html += `
          <tr>
            <td>${item.Sub_band_lower_limit} – ${item.Sub_band_upper_limit}</td>
            <td>${item.Services_in_Finland || "-"}</td>
            <td>${item.Comment || item.Sub_band_usage || "-"}</td>
          </tr>`;
      });
      tableBody.innerHTML = html;
    }
    

  function filterTable() {
    const query = searchInput.value.toLowerCase();
    const filtered = originalData.filter(item =>
      (item.Sub_band_lower_limit + item.Sub_band_upper_limit + item.Services_in_Finland + item.Comment)
        .toLowerCase().includes(query)
    );
    renderTable(filtered);
  }

  function resetTable() {
    searchInput.value = "";
    renderTable(originalData);
  }

  searchButton.addEventListener("click", filterTable);
  resetButton.addEventListener("click", resetTable);
});
