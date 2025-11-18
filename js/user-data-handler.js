export function setupUserDataHandlers(authManager) {
    const editBtn = document.getElementById("edit");
    const saveBtn = document.getElementById("saveBtn");

    const fields = [
        { span: "surname-text", input: "surname-input", key: "surname" },
        { span: "name-text", input: "name-input", key: "name" },
        { span: "patronymic-text", input: "patronymic-input", key: "patronymic" },
        { span: "email", input: "email-input", key: "email" },
        { span: "phone-text", input: "phone-input", key: "phone" },
        { span: "date-text", input: "date-input", key: "date" }
    ];

    function editData() {
        fields.forEach(f => {
            const span = document.getElementById(f.span);
            const input = document.getElementById(f.input);

            if (input && span) {
                span.classList.add("hidden");
                input.classList.remove("hidden");
                input.disabled = false;
            }
        });

        if (editBtn && saveBtn) {
            editBtn.classList.add("hidden");
            saveBtn.classList.remove("hidden");
        }
    }

    async function saveData() {
        const userData = {};
        let isValid = true;

        fields.forEach(f => {
            const input = document.getElementById(f.input);
            if (input) {
                userData[f.key] = input.value;

                if (f.key === 'email' && input.value && !input.value.includes('@')) {
                    isValid = false;
                    alert('Введите корректный email');
                }
            }
        });

        if (!isValid) return;

        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`https://backendalcraft-production.up.railway.app//users/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Ошибка сохранения данных');
            }

            fields.forEach(f => {
                const span = document.getElementById(f.span);
                const input = document.getElementById(f.input);

                if (span && input) {
                    span.textContent = input.value || '—';
                    span.classList.remove("hidden");
                    input.classList.add("hidden");
                    input.disabled = true;
                }
            });

            if (editBtn && saveBtn) {
                editBtn.classList.remove("hidden");
                saveBtn.classList.add("hidden");
            }

            authManager.domHelper.showNotification('Данные сохранены успешно!', 'success');

        } catch (error) {
            console.error('Ошибка сохранения:', error);
            authManager.domHelper.showNotification('Ошибка сохранения данных', 'error');
        }
    }

    if (editBtn && saveBtn) {
        editBtn.addEventListener("click", editData);
        saveBtn.addEventListener("click", saveData);
    }

}
