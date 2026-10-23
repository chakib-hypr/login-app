const loginForm = document.getElementById('login');
const registerForm = document.getElementById('register');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const profileText = document.getElementById('profile-text');

function showForms(formId) {
    document.querySelectorAll('.form-box').forEach(function(form) {
        form.classList.remove('active');
    });

    const targetForm = document.getElementById(formId);
    if (targetForm) {
        targetForm.classList.add('active');
    }
}

function sendForm(url, form) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: form.username.value,
            password: form.password.value
        })
    })
    .then(response => {
        return response.json().then(data => {
            return { ok: response.ok, data: data };
        });
    });
}

function loadProfile() {
    const token = localStorage.getItem('token');

    if (!token) {
        return;
    }

    fetch('/api/me', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            localStorage.removeItem('token');
            return null;
        }
        return response.json();
    })
    .then(user => {
        if (user) {
            profileText.textContent = 'Logged in as ' + user.username + ' (' + user.role + ')';
            showForms('profile');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    loginMessage.textContent = '';

    sendForm('/api/login', loginForm)
    .then(result => {
        if (result.ok) {
            localStorage.setItem('token', result.data.token);
            loginForm.reset();
            loadProfile();
        } else {
            loginMessage.textContent = result.data.error;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Connection error occurred with the server.');
    });
});

registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    registerMessage.textContent = '';

    sendForm('/api/signup', registerForm)
    .then(result => {
        if (result.ok) {
            registerForm.reset();
            loginMessage.textContent = 'Account created, you can log in now';
            showForms('login-form');
        } else {
            registerMessage.textContent = result.data.error;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Connection error occurred with the server.');
    });
});

document.getElementById('logout').addEventListener('click', function() {
    localStorage.removeItem('token');
    showForms('login-form');
});

loadProfile();