document.getElementById('addproductsubmit').addEventListener('click', function (event) {
  const name = document.getElementById('Name').value.trim();
  const price = document.getElementById('price').value.trim();
  const category = document.getElementById('category').value.trim();
  const quantity = document.getElementById('quantity').value.trim();
  const description = document.getElementById('description').value.trim();
  const imageInput = document.getElementById('imageInput');

  const nameError = document.getElementById('nameError');
  const priceError = document.getElementById('priceError');
  const categoryError = document.getElementById('categoryError');
  const quantityError = document.getElementById('quantityError');
  const descriptionError = document.getElementById('descriptionError');
  const imageError = document.getElementById('imageError');

  nameError.textContent = '';
  priceError.textContent = '';
  categoryError.textContent = '';
  quantityError.textContent = '';
  descriptionError.textContent = '';
  imageError.textContent = '';

  if (name === '') {
    nameError.textContent = 'Product name is required.';
    event.preventDefault();
  } else if (name.length < 3 || name.length > 50) {
    nameError.textContent = 'Product name should be between 3 and 50 characters.';
    event.preventDefault();
  }
  if (price === '') {
    priceError.textContent = 'Price is required.';
    event.preventDefault();
  } else if (isNaN(price) || parseFloat(price) <= 0) {
    priceError.textContent = 'Price should be a positive number.';
    event.preventDefault();
  }
  if (category === '') {
    categoryError.textContent = 'Category is required.';
    event.preventDefault();
  }
  if (quantity === '') {
    quantityError.textContent = 'Quantity is required.';
    event.preventDefault();
  } else if (isNaN(quantity) || parseInt(quantity) <= 0) {
    quantityError.textContent = 'Quantity should be a positive number.';
    event.preventDefault();
  }
  if (description === '') {
    descriptionError.textContent = 'Description is required.';
    event.preventDefault();
  } else if (description.length < 10 || description.length > 500) {
    descriptionError.textContent = 'Description should be between 10 and 500 characters.';
    event.preventDefault();
  }
  if (imageInput.files.length === 0) {
    imageError.textContent = 'Please choose 4 image.';
    event.preventDefault();
  } else if (imageInput.files.length > 4) {
    imageError.textContent = 'You can upload only  4 images.';
    event.preventDefault();
  }
  chosenFiles.textContent = '';
  for (const file of imageInput.files) {
    chosenFiles.textContent += file.name + ', ';
  }
  chosenFiles.textContent = chosenFiles.textContent.slice(0, -2); 
});
