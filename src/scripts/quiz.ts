/** choice / input soru sayfaları: tek deneme, sonra açıklama. */
const fold = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/["'`“”‘’]/g, "")
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

document.querySelectorAll<HTMLFormElement>("form[data-quiz]").forEach((form) => {
  const result = form.querySelector<HTMLElement>(".quiz-result")!;
  const explain = form.querySelector<HTMLElement>(".quiz-explain");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.dataset.answered) return;
    let ok = false;
    if (form.dataset.quiz === "choice") {
      const picked = form.querySelector<HTMLInputElement>("input[type=radio]:checked");
      if (!picked) { result.textContent = "Önce bir seçenek seç."; return; }
      ok = picked.closest<HTMLElement>(".quiz-option")!.dataset.correct === "1";
      form.querySelectorAll<HTMLElement>(".quiz-option").forEach((opt) => {
        opt.classList.add(opt.dataset.correct === "1" ? "is-right" : "is-rest");
        if (opt.contains(picked)) opt.classList.add("is-picked");
      });
    } else {
      const input = form.querySelector<HTMLInputElement>("input[type=text]")!;
      if (!input.value.trim()) { result.textContent = "Önce cevabını yaz."; return; }
      const accept: string[] = JSON.parse(form.dataset.accept || "[]");
      ok = accept.some((a) => fold(a) === fold(input.value));
      input.readOnly = true;
      if (!ok) result.dataset.answer = accept[0] ?? "";
    }
    form.dataset.answered = ok ? "right" : "wrong";
    result.textContent = ok ? "Doğru." : form.dataset.quiz === "input" ? `Yanlış. Doğru cevap: ${result.dataset.answer}` : "Yanlış. Doğru seçenek işaretlendi.";
    form.querySelectorAll<HTMLInputElement>("input").forEach((i) => (i.disabled = form.dataset.quiz === "choice" ? true : i.disabled));
    if (explain) explain.hidden = false;
    form.querySelector<HTMLButtonElement>(".quiz-submit")!.disabled = true;
  });
});
