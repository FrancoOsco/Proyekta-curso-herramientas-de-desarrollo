const termsCheckbox = document.getElementById('terms');
                const submitButton = document.getElementById('btnRegistrar');

                termsCheckbox.addEventListener('change', () => {
                  submitButton.disabled = !termsCheckbox.checked;
                })