const realUploadButton = document.getElementById("file-upload");
const fakeButton = document.getElementById("image-button");
const gameTitle = document.getElementById("game-title");

fakeButton.addEventListener("click", () => {
  realUploadButton.click();
})

realUploadButton.addEventListener("change", e => handleImageFile(e.target.files[0]));

function handleImageFile(file){
  // Create file reader for reading image file
  const reader = new FileReader();

  // Function that will be called when file is done loading
  function doneLoading(event) {
    // Create image element with the image file, and attach function that is called when image is ready.
    const img = new Image();
    img.onload = function(){ image = img; computePointsFromImage(); drawStuff() };
    img.src = event.target.result;

    // Remove start menu GUI
    fakeButton.remove();
    gameTitle.remove();
  }

  // Can be used in the future for showing a progress indicator for loading the image; currently prints to console.
  function loadingBar(event) {
    if (event.loaded && event.total){
      const percent = (event.loaded / event.total) * 100;
      console.log("Loading image...: " + percent + "%");
    }
  }

  // Attach event listeners
  reader.addEventListener('progress', loadingBar);
  reader.onload = doneLoading;

  // Read the image file
  reader.readAsDataURL(file);
}