document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("lang") || "fi";
  loadLanguage(savedLang);

  document.querySelectorAll("[data-lang-switch]").forEach(button => {
    button.addEventListener("click", () => {
      const selectedLang = button.getAttribute("data-lang-switch");
      localStorage.setItem("lang", selectedLang);
      loadLanguage(selectedLang);
    });
  });
});

function loadLanguage(lang) {
  document.documentElement.lang = lang;

  fetch(`../lang/lang-${lang}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Käännöstiedostoa ei löytynyt");
      }
      return response.json();
    })
    .then(translations => {
      for (const key in translations) {
        document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => {
          el.textContent = translations[key];
        });
      }

      // Päivitetään <title>
      if (translations.page_title) {
        document.title = translations.page_title;
      }

      // Päivitetään <meta name="description">
      if (translations.meta_description) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute("content", translations.meta_description);
        }
      }
    })
    .catch(error => console.error("Käännöksiä ei voitu ladata:", error));
}
