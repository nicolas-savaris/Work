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



async function loadEquipment() {
    const tableBody = document.getElementById("equipmentTableBody");
    const equipmentCount = document.getElementById("equipmentCount");
    const searchInput = document.getElementById("equipmentSearch");

    let allEquipment = [];

    function renderEquipment(devices) {
        equipmentCount.textContent =
            `${devices.length} ${devices.length === 1 ? "device" : "devices"}`;

        tableBody.replaceChildren();

        if (devices.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();

            cell.colSpan = 5;
            cell.textContent = searchInput.value.trim()
                ? "No matching equipment found."
                : "No equipment registered yet.";

            return;
        }

        devices.forEach((device) => {
            const row = tableBody.insertRow();

            const values = [
                device.brand,
                device.device_type === "docking_station"
                    ? "Docking station"
                    : device.device_type,
                device.serial_number,
                device.service_tag || "—",
                device.assigned_to
            ];

            values.forEach((value) => {
                const cell = row.insertCell();
                cell.textContent = value ?? "—";
            });
        });
    }

    function filterEquipment() {
        const query = searchInput.value.trim().toLowerCase();

        const filteredEquipment = allEquipment.filter((device) => {
            const searchableValues = [
                device.brand,
                device.device_type === "docking_station"
                    ? "Docking station"
                    : device.device_type,
                device.serial_number,
                device.service_tag,
                device.assigned_to
            ];

            return searchableValues.some((value) =>
                String(value ?? "").toLowerCase().includes(query)
            );
        });

        renderEquipment(filteredEquipment);
    }

    searchInput.addEventListener("input", filterEquipment);

    try {
        const response = await fetch("/equipment");

        if (!response.ok) {
            throw new Error("Failed to load equipment");
        }

        allEquipment = await response.json();

        filterEquipment();
    } catch (error) {
        console.error("Error loading equipment:", error);

        tableBody.replaceChildren();

        const row = tableBody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 5;
        cell.textContent = "Unable to load equipment. Please try again.";
    }
}

loadEquipment();

