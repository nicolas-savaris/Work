const serialPhoto = document.querySelector("#serialPhoto");
const serialNumber = document.querySelector("#serialNumber");

console.log(serialPhoto);
console.log(serialNumber);

serialPhoto.addEventListener("change", async() => {
    const photo = serialPhoto.files[0];
    if (!photo) {
    return;
    }
    console.log("Starting OCR...");
    const result = await Tesseract.recognize(
        photo,
        "eng"
    );
    const lines = result.data.text.split("\n");
    const cleanedLines = lines.map(line => line.trim());
    console.log(cleanedLines);
    
    serialNumber.value = result.data.text.trim();
    
    //Debug
    console.log(lines);
    console.log("OCR completed!");
    console.log(result.data.text);
    console.log(photo);
});

