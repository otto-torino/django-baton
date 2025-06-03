import $ from 'jquery'

const Login = {
  init: function (config) {
    // splash
    if (config.loginSplash) {
      $('body.login').css({
        background: `url(${config.loginSplash}) no-repeat center center`,
        backgroundSize: 'cover',
      })
    }
    // form
    const inputUsername = $('#id_username')
    const inputPassword = $('#id_password')

    const usernameField = $('<div />', { class: 'input-group mb-2' })
      .append($('<span />', { class: 'input-group-text' }).append('<i class="material-symbols-outlined">person</i>'))
      .append(inputUsername.clone())

    inputUsername.replaceWith(usernameField)

    // adds show/hide password functionality
    const passwordInputField = inputPassword.clone()
    const viewPasswordIcon = $('<i />', { class: 'material-symbols-outlined pwd-visibility-toggle' })
      .text('visibility')
      .on('click', function () {
        const visible = $(this).text() === 'visibility'
        $(this).text(visible ? 'visibility_off' : 'visibility')
        passwordInputField.attr('type', visible ? 'password' : 'text')
      })

    const passwordField = $('<div />', { class: 'input-group mb-2' })
      .append($('<span />', { class: 'input-group-text' }).append('<i class="material-symbols-outlined">key</i>'))
      .append(passwordInputField)
      .append(viewPasswordIcon)

    inputPassword.replaceWith(passwordField)
  },
}

export default Login
