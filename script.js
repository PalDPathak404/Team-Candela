
        const tableBody = document.getElementById('userTableBody');
        const roles = ["Employee", "Manager", "Intern", "HR", "Admin"];

        function displayMessage(message, type = 'success') {
            const msgElement = document.getElementById('feedbackMessage');
            msgElement.innerHTML = message;

            msgElement.className = '';
            msgElement.classList.add(`message-${type}`, 'active');

            setTimeout(() => {
                msgElement.classList.remove('active');
                setTimeout(() => {
                    msgElement.innerHTML = '';
                    msgElement.className = '';
                }, 400);
            }, 5000);
        }

        function createRowHTML(data = {}) {
            const user = data.user || '';
            const manager = data.manager || '';
            const email = data.email || '';
            const selectedRole = data.role || '';

            let roleOptions = roles.map(role =>
                `<option value="${role}" ${role === selectedRole ? 'selected' : ''}>${role}</option>`
            ).join('');

            return `
                <tr>
                    <td contenteditable="true" data-label="User">${user}</td>
                    <td data-label="Role">
                        <select onchange="saveTableData()">
                            <option value="">--Select Role--</option>
                            ${roleOptions}
                        </select>
                    </td>
                    <td contenteditable="true" data-label="Manager">${manager}</td>
                    <td contenteditable="true" data-label="Email">${email}</td>
                    <td><button class="action-btn" onclick="sendPassword(this)">Send Password</button></td>
                </tr>
            `;
        }

        function addNewRow() {
            const newRowHtml = createRowHTML();
            tableBody.insertAdjacentHTML('beforeend', newRowHtml);
            saveTableData();
            displayMessage('New user row added! Data saved automatically. 🚀', 'success');
        }

        function saveTableData(event) {
            const rows = tableBody.querySelectorAll("tr");
            const userData = [];

            rows.forEach(row => {
                const user = row.cells[0].innerText.trim();
                const role = row.cells[1].querySelector("select").value;
                const manager = row.cells[2].innerText.trim();
                const email = row.cells[3].innerText.trim();

                userData.push({
                    user,
                    role,
                    manager,
                    email
                });
            });

            const isManualSave = event && event.currentTarget.classList.contains('storage-btn');
            const isTableCompletelyEmpty = userData.every(rowData =>
                !rowData.user && !rowData.role && !rowData.manager && !rowData.email
            );


            if (isManualSave) {
                if (isTableCompletelyEmpty) {
                    displayMessage('**SAVE FAILED:** The table is completely empty. Add user data before saving. 🛑', 'error');
                    return;
                }

                let incompleteRowIndex = -1;
                let missingField = '';

                for (let i = 0; i < userData.length; i++) {
                    const rowData = userData[i];

                    const isInUse = rowData.user || rowData.role || rowData.manager || rowData.email;

                    if (isInUse) {
                        if (!rowData.user) {
                            incompleteRowIndex = i + 1;
                            missingField = 'User Name';
                            break;
                        }
                        if (!rowData.role) {
                            incompleteRowIndex = i + 1;
                            missingField = 'Role Selection';
                            break;
                        }
                        if (!rowData.manager) {
                            incompleteRowIndex = i + 1;
                            missingField = 'Manager Name';
                            break;
                        }

                        const isStructurallyValid = rowData.email &&
                            rowData.email.includes("@") &&
                            rowData.email.indexOf(".") > rowData.email.indexOf("@");

                        const isLowercase = rowData.email === rowData.email.toLowerCase();

                        if (!isStructurallyValid) {
                            incompleteRowIndex = i + 1;
                            missingField = 'Email (Invalid format or Empty)';
                            break;
                        }
                        if (!isLowercase) {
                            incompleteRowIndex = i + 1;
                            missingField = 'Email (Must be lowercase)';
                            break;
                        }
                    }
                }

                if (incompleteRowIndex !== -1) {
                    displayMessage(`
                        **SAVE FAILED:** Row ${incompleteRowIndex} is incomplete or invalid.
                        Missing field: **${missingField}**.
                        Please complete all details in the row before saving all data.
                    `, 'error');
                    return;
                }
            }

            try {
                localStorage.setItem('userTableData', JSON.stringify(userData));

                if (isManualSave) {
                    displayMessage('Table data manually saved! ✅', 'success');
                }
            } catch (e) {
                console.error('Local Storage Save Error:', e);
                displayMessage('Error saving data to Local Storage. Please check console.', 'error');
            }
        }


        function loadTableData() {
            const userTable = document.getElementById('userTable');

            userTable.addEventListener('blur', function (e) {
                if (e.target.closest('td[contenteditable="true"]')) {
                    saveTableData();
                }
            }, true);

            userTable.addEventListener('input', function (e) {
                if (e.target.closest('td[contenteditable="true"]')) {
                    saveTableData();
                }
            });

            const storedData = localStorage.getItem('userTableData');
            tableBody.innerHTML = '';

            if (storedData) {
                try {
                    const userData = JSON.parse(storedData);

                    if (Array.isArray(userData)) {
                        userData.forEach(data => {
                            tableBody.insertAdjacentHTML('beforeend', createRowHTML(data));
                        });
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing Local Storage data:', e);
                }
            }

            for (let i = 0; i < 5; i++) {
                tableBody.insertAdjacentHTML('beforeend', createRowHTML());
            }
        }

        function sendPassword(btn) {
            const row = btn.closest("tr");

            const rawUser = row.cells[0].innerText.trim();
            const roleSelect = row.cells[1].querySelector("select");
            const role = roleSelect.value;
            const manager = row.cells[2].innerText.trim();
            const emailCell = row.cells[3];
            const email = emailCell.innerText.trim();

            const userDisplayName = rawUser || "User";

            const validationFailed = (cell, msg) => {
                displayMessage(msg, 'error');
                const errorColor = getComputedStyle(document.documentElement).getPropertyValue('--color-error-text').trim();
                cell.style.boxShadow = `inset 0 0 0 2px ${errorColor}`;
                setTimeout(() => cell.style.boxShadow = 'none', 1000);
                return true;
            };

            if (!rawUser) return validationFailed(row.cells[0], "The **User** name field is required. 📝");
            if (!role) return validationFailed(row.cells[1], "Please **select a role** before sending link. ⚠️");
            if (!manager) return validationFailed(row.cells[2], "The **Manager** field is required. 📝");

            const isStructurallyValid = email &&
                email.includes("@") &&
                email.indexOf(".") > email.indexOf("@");

            const isLowercase = email === email.toLowerCase();

            if (!isStructurallyValid) return validationFailed(emailCell, "Please enter a **valid email**. ✉️");
            if (!isLowercase) return validationFailed(emailCell, "Email must be written **entirely in lowercase**. 📧");

            displayMessage(`
                **SUCCESS:** Password **reset link** simulated for ${userDisplayName}! 🔗
                A link has been sent to: **${email}**
            `, 'success');

            saveTableData();
        }