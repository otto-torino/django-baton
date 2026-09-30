import $ from 'jquery'

/**
 * AI image input component
 *
 * Activates the inputs of BatonAiImageField, which the widget template marks
 * with data-baton-ai-image and configures with the attributes of the form
 * field (alt_field, alt_chars, alt_language, subject_location_field). It used
 * to be inline scripts of the template: here it runs under a Content Security
 * Policy too, since widget templates do not get the request nonce.
 */
const ImageInput = {
  PIN_DIM: 20, // pin dimensions
  init: function (AI, Dispatcher) {
    const self = this
    Dispatcher.register('onReady', function () {
      // the empty form of the inlines too: new rows clone its button
      $('input[data-baton-ai-image]').each(function (_, input) {
        self.activate(AI, input, false)
      })
    })
    // the button of a new inline row is there, cloned, but without its events
    document.addEventListener('formset:added', function (event) {
      $(event.target)
        .find('input[data-baton-ai-image]')
        .each(function (_, input) {
          self.activate(AI, input, true)
        })
    })
    $('[data-baton-subject-preview]').each(function (_, preview) {
      self.initSubjectPreview($(preview))
    })
  },
  activate: function (AI, input, onlyEvents) {
    AI.addImageGeneration(input.name, onlyEvents)
    const altField = input.getAttribute('alt_field')
    if (altField) {
      AI.addVision(
        '#' + input.id,
        {
          target: altField,
          chars: input.getAttribute('alt_chars'),
          language: input.getAttribute('alt_language'),
        },
        onlyEvents,
      )
    }
  },
  /**
   * The draggable pin setting the subject of the image: its position is
   * stored in percentages in the subject location field.
   */
  initSubjectPreview: function (preview) {
    const self = this
    const inputId = preview.attr('data-input-id')
    const locationField = preview.attr('data-subject-location-field')
    const imageUrl = preview.find('img').attr('src')
    let pin
    let width
    let height

    // inline?
    const lastDash = inputId.lastIndexOf('-')
    const positionInput =
      lastDash !== -1 ? $('#' + inputId.substr(0, lastDash) + '-' + locationField) : $('#id_' + locationField)

    // from top left edge pin coordinates to center coordinates
    const toCenterCoordinates = (pinCoords) => ({
      left: pinCoords.left + self.PIN_DIM / 2,
      top: pinCoords.top + self.PIN_DIM / 2,
    })
    // from center coordinates to top left edge pin coordinates
    const toEdgeCoordinates = (pointerCoords) => ({
      left: pointerCoords.left - self.PIN_DIM / 2,
      top: pointerCoords.top - self.PIN_DIM / 2,
    })
    const percToPreviewCoordinates = (perc) => ({ left: (perc.left * width) / 100, top: (perc.top * height) / 100 })
    const previewToPercCoordinates = (coords) => ({ left: (coords.left * 100) / width, top: (coords.top * 100) / height })

    const updateInputPosition = function (perc) {
      if (perc === undefined && !positionInput.val()) {
        // to the center
        perc = { left: 50, top: 50 }
      }
      if (perc) {
        perc = { top: Math.round(perc.top), left: Math.round(perc.left) }
        positionInput.val(perc.left + ',' + perc.top)
      } else {
        const parts = positionInput.val().split(',')
        perc = { left: parts[0], top: parts[1] }
      }
      return perc
    }

    // let's work in pointer coordinates
    const handleMousedown = function (e) {
      const dragging = {
        pageX0: e.pageX,
        pageY0: e.pageY,
        elem: this,
        offset0: toCenterCoordinates($(this).position(preview)),
      }
      const handleDragging = function (e) {
        // constrain left and top to image size
        const left = Math.min(Math.max(dragging.offset0.left + (e.pageX - dragging.pageX0), 0), width)
        const top = Math.min(Math.max(dragging.offset0.top + (e.pageY - dragging.pageY0), 0), height)
        $(dragging.elem).css(toEdgeCoordinates({ top: top, left: left }))
        // let's store in original coordinates
        updateInputPosition(previewToPercCoordinates({ left: left, top: top }))
      }
      const handleMouseup = function () {
        $('body').off('mousemove', handleDragging).off('mouseup', handleMouseup)
      }
      $('body').on('mouseup', handleMouseup).on('mousemove', handleDragging)
    }

    const updatePinPosition = function () {
      height = preview.height()
      width = preview.width()
      const initPinPosition = toEdgeCoordinates(percToPreviewCoordinates(updateInputPosition()))
      if (!pin) {
        pin = $('<div />').on('mousedown', handleMousedown)
      }
      pin
        .css({
          background: 'black',
          border: '6px double white',
          width: self.PIN_DIM + 'px',
          height: self.PIN_DIM + 'px',
          'border-radius': '50%',
          position: 'absolute',
          top: initPinPosition.top,
          left: initPinPosition.left,
          'user-select': 'none',
        })
        .appendTo(preview)
    }

    preview.on('click', function (e) {
      const offset = $(this).offset()
      const left = Math.min(Math.max(e.pageX - offset.left, 0), width)
      const top = Math.min(Math.max(e.pageY - offset.top, 0), height)
      pin.css(toEdgeCoordinates({ top: top, left: left }))
      // let's store in original coordinates
      updateInputPosition(previewToPercCoordinates({ left: left, top: top }))
    })
    positionInput.on('blur', function () {
      const parts = $(this).val().split(',')
      pin.css(toEdgeCoordinates(percToPreviewCoordinates({ left: parts[0], top: parts[1] })))
    })

    const image = new Image()
    image.onload = updatePinPosition
    image.src = imageUrl
    new ResizeObserver(updatePinPosition).observe(preview[0])
  },
}

export default ImageInput
