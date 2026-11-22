const serialPhoto = document.querySelector("#serialPhoto");
const serialNumber = document.querySelector("#serialNumber");

console.log(serialPhoto);
console.log(serialNumber);

const scanType = document.querySelector("#scanType");

async function loadCurrentUser() {
    try {
        const response = await fetch("/api/me");

        if (!response.ok) {
            throw new Error("Unable to load user information");
        }

        const user = await response.json();

        document.getElementById("userName").textContent = user.username;

        document.getElementById("userRole").textContent =
            user.role === "admin" ? "Administrator" : "Operator";

    } catch (error) {
        console.error("User loading error:", error);
    }
}

loadCurrentUser();

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

const equipmentForm = document.getElementById("equipmentForm");

equipmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const equipmentData = {
        brand: document.getElementById("brand").value.trim(),
        deviceType: document.getElementById("deviceType").value,
        serialNumber: document.getElementById("serialNumber").value.trim(),
        serviceTag: document.getElementById("serviceTag").value.trim(),
        assignedTo: document.getElementById("assignedTo").value.trim(),
        warrantyExpiryDate:
            document.getElementById("warrantyExpiryDate").value || null
    };

    try {
        const response = await fetch("/equipment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(equipmentData)
        });

        const responseBody = await response.text();

        let result;
        try {
            result = JSON.parse(responseBody);
        } catch {
            result = { message: responseBody };
        }

        if (!response.ok) {
            throw new Error(
                result.error || result.message || "Unable to create equipment."
            );
        }

        alert(result.message || "Equipment created successfully!");

        equipmentForm.reset();
        window.location.reload();

    } catch (error) {
        console.error("Error creating equipment:", error);
        alert(error.message);
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

            cell.colSpan = 6;
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
                device.assigned_to, 
                device.warranty_expiry_date
        ? String(device.warranty_expiry_date).slice(0, 10).split("-").reverse().join("/")
        : "—"
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
                device.assigned_to,
                device.warranty_expiry_date
        ? String(device.warranty_expiry_date).slice(0, 10).split("-").reverse().join("/")
        : "—"
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

        cell.colSpan = 6;
        cell.textContent = "Unable to load equipment. Please try again.";
    }
}

loadEquipment();

