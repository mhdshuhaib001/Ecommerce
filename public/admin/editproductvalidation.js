//---------------------ADD PRODUCT VALIDATION-------------------------

document
  .getElementById('editProductsubmit')
  .addEventListener('click', function (event) {
    const name = document.getElementById('Name').value
    const price = document.getElementById('price').value
    const quantity = document.getElementById('quantity').value
    const description = document.getElementById('description').value

    const message = document.getElementById('error-message')

    if (
      price.trim() === '' &&
      quantity.trim() == '' &&
      description.trim() == ''
    ) {
      message.style.display = 'block'
      message.textContent = 'Must fillout all the fields.'
      event.preventDefault()
    } else if (name.trim() == '') {
      message.style.display = 'block'
      message.textContent = 'Product name is required.'
      event.preventDefault()
    } else if (price < 1) {
      message.style.display = 'block'
      message.textContent = 'Price must be positive value.'
      event.preventDefault()
    } else if (quantity < 1) {
      message.style.display = 'block'
      message.textContent = 'Quantity must be positive value.'
      event.preventDefault()
    } else if (description.length < 10) {
      message.style.display = 'block'
      message.textContent = 'Description atleast 10 letters.'
    }
  })


  function validateForm() {
    document.getElementById('titleError').textContent = '';
    document.getElementById('descriptionError').textContent = '';
    document.getElementById('imageError').textContent = '';
  
    const titleInput = document.getElementById('exampleInputName1');
    const descriptionInput = document.getElementById('exampleInputEmail3');
    const imageInput = document.getElementById('imageInputBanner');
  
    if (titleInput.value.trim() === '') {
      document.getElementById('titleError').textContent = 'Title cannot be empty.';
    } else if (titleInput.value.trim().length < 4) {
      document.getElementById('titleError').textContent = 'Title must have at least 5 words.';
    } else if (descriptionInput.value.trim() === '') {
      document.getElementById('descriptionError').textContent = 'Description cannot be empty.';
    } else if (descriptionInput.value.trim().length > 20){
      document.getElementById('descriptionError').textContent = 'Description cannot be graterthan 20.';
    } else if (imageInput.files.length === 0) {
      document.getElementById('imageError').textContent = 'Please choose an image.';
    } else {
      return true;
    }
  
    return false;
  }
  