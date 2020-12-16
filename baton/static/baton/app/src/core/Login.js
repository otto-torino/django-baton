import $ from 'jquery'

const Login = {
  init: function () {
    let inputUsername = $('#id_username')
    let inputPassword = $('#id_password')

    const usernameField = $('<div />', { class: 'input-group mb-2' })
      .append(
        $('<span />', { class: 'input-group-text' }).append(
          '<i class="fa fa-user"></i>'
        )
      )
      .append(inputUsername.clone())

    inputUsername.replaceWith(usernameField)

    // adds show/hide password functionality
    let passwordInputField = inputPassword.clone()
    let viewPasswordIcon = $('<i />', {'class': 'fa fa-eye pwd-visibility-toggle'}).on('click', function () {
      let visible = $(this).hasClass('fa-eye-slash')
      console.log($(this), this)
      $(this)[visible ? 'removeClass' : 'addClass']('fa-eye-slash')
      passwordInputField.attr('type', visible ? 'password' : 'text')
    })

    const passwordField = $('<div />', { class: 'input-group mb-2' })
      .append(
        $('<span />', { class: 'input-group-text' }).append(
          '<i class="fa fa-key"></i>'
        )
      )
      .append(passwordInputField)
      .append(viewPasswordIcon)

    inputPassword.replaceWith(passwordField)
  }
}

export default Login
