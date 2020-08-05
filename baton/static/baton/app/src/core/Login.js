import $ from 'jquery'

const Login = {
  init: function () {
    let inputUsername = $('#id_username')
    let inputPassword = $('#id_password')

    const usernameField = $('<div />', { class: 'input-group mb-2' })
      .append(
        $('<div />', { class: 'input-group-prepend' }).append(
          '<div class="input-group-text"><i class="fa fa-user"></i></div>'
        )
      )
      .append(inputUsername.clone())

    inputUsername.replaceWith(usernameField)

    const passwordField = $('<div />', { class: 'input-group mb-2' })
      .append(
        $('<div />', { class: 'input-group-prepend' }).append(
          '<div class="input-group-text"><i class="fa fa-key"></i></div>'
        )
      )
      .append(inputPassword.clone())

    inputPassword.replaceWith(passwordField)
  }
}

export default Login
