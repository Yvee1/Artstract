const realUploadButton = document.getElementById("file-upload");
const fakeButton = document.getElementById("image-button");

fakeButton.addEventListener("click", () => {
  realUploadButton.click();
})

realUploadButton.addEventListener("change", e => handleImageFile(e.target.files[0]));