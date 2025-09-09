export class DomHelper {
    getFormData() {
        return {
            email: document.getElementById('reg-email')?.value.trim() || '',
            password: document.getElementById('password')?.value.trim() || '',
            repeat: document.getElementById('repeat-password')?.value.trim() || ''
        };
    }

    showLoading(show) {
        const submitBtn = document.querySelector(".submit-btn");
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> Загрузка...';
            } else {
                submitBtn.disabled = false;
                const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
                submitBtn.textContent = activeTab === 'register' ? 'Зарегистрироваться' : 'Войти';
            }
        }
    }

    toggleAuthVisibility(showAuth) {
        const authBlock = document.getElementById('auth-block');
        const cabinetBlock = document.getElementById('cabinet-block');

        if (authBlock) {
            authBlock.style.display = showAuth ? 'block' : 'none';
        }
        if (cabinetBlock) {
            cabinetBlock.style.display = showAuth ? 'none' : 'flex';
        }
    }

    updateUserProfile(user) {
        const nameSurname = document.querySelector('.name-surname');
        if (nameSurname) {
            const fullName = `${user.surname || ''} ${user.name || ''}`.trim();
            nameSurname.textContent = fullName || '—';
        }

        const phoneEl = document.getElementById('phone');
        if (phoneEl) {
            phoneEl.textContent = user.phone || '—';
        }
    }

    updateUserFormFields(user) {
        const fields = [
            { span: "surname-text", input: "surname-input", key: "surname" },
            { span: "name-text", input: "name-input", key: "name" },
            { span: "patronymic-text", input: "patronymic-input", key: "patronymic" },
            { span: "email", input: "email-input", key: "email" },
            { span: "phone-text", input: "phone-input", key: "phone" },
            { span: "date-text", input: "date-input", key: "date" }
        ];

        fields.forEach(f => {
            const span = document.getElementById(f.span);
            const input = document.getElementById(f.input);

            if (span && input) {
                const value = user[f.key] || '';
                span.textContent = value || '—';
                input.value = value;
                
                span.classList.remove("hidden");
                input.classList.add("hidden");
                input.disabled = true;
            }
        });
    }

    resetEditMode() {
        const editBtn = document.getElementById("edit");
        const saveBtn = document.getElementById("saveBtn");
        
        if (editBtn && saveBtn) {
            editBtn.classList.remove("hidden");
            saveBtn.classList.add("hidden");
        }
    }

    showNotification(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}