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
    const res = await fetch("http://localhost:5000/marketing/upload-invoice", {
      method: "POST",
      body: formData, // Send multiple files
    });

    // Check if the server is responding correctly
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    // Check if the response is valid JSON
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      throw new Error("Invalid JSON response from server.");
    }

    console.log("API Response:", data);

    // Check if the server sent a valid response
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
