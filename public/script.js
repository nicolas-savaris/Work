const serialPhoto = document.querySelector("#serialPhoto");
const serialNumber = document.querySelector("#serialNumber");

console.log(serialPhoto);
console.log(serialNumber);

const scanType = document.querySelector("#scanType");

serialPhoto.addEventListener("change", async () => {
  const photo = serialPhoto.files[0];

  if (!photo) return;

  const image = new Image();
  image.src = URL.createObjectURL(photo);

  try {
    await image.decode();

    const reader = new window.BrowserMultiFormatReader();
    const result = await reader.decodeFromImageElement(image);

    const decodedValue = result.getText();

    if (scanType.value === "serialNumber") {
      document.querySelector("#serialNumber").value = decodedValue;
    } else {
      document.querySelector("#serviceTag").value = decodedValue;
    }

    console.log("Codice letto:", decodedValue);
  } catch (error) {
    console.error("Impossibile leggere il codice:", error);
    alert("Codice non rilevato. Prova con una foto più nitida e ritagliata.");
  } finally {
    URL.revokeObjectURL(image.src);
  }
});
