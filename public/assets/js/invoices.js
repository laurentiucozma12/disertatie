// Select form elements
const metaForm = document.querySelector(".meta-form");
const description = document.querySelector(".description p");
const fileInput = document.querySelector("#invoice");
const textInput = document.querySelector("input[name='title']");

// Handle form submission
metaForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevents page reload

  // Check if files are selected
  if (!fileInput.files.length) {
    description.textContent = "Please upload at least one PDF invoice.";
    return;
  }

  // Check if a question is entered
  const question = textInput.value.trim();
  if (!question) {
    description.textContent = "Please enter a question.";
    return;
  }

  const formData = new FormData();

  // Append all selected files to formData
  for (let file of fileInput.files) {
    formData.append("invoices", file);
  }

  formData.append("question", question); // Send question with files

  try {
    const res = await fetch("http://localhost:4000/upload-invoice", {
      method: "POST",
      body: formData, // Send multiple files
    });

    // ✅ Verificare dacă serverul răspunde corect
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    // ✅ Verificare dacă răspunsul este JSON valid
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      throw new Error("Invalid JSON response from server.");
    }

    console.log("API Response:", data);

    // ✅ Verificare dacă serverul a trimis un răspuns valid
    if (data?.response) {
      description.textContent = data.response; // Update page with response
    } else {
      description.textContent = "No response found.";
    }
  } catch (error) {
    console.error("Error uploading invoices:", error);
    description.textContent = `Error: ${error.message}`;
  }
});
