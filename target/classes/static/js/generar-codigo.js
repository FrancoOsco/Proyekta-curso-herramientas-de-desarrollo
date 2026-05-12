const generatedIdInput = document.getElementById('projectGeneratedId');
const projectNameInput = document.getElementById('projectName');

if (projectNameInput && generatedIdInput) {
  projectNameInput.addEventListener('input', () => {
    const generatedId = 'PRJ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    generatedIdInput.value = generatedId;
  });
}
