    document.addEventListener('DOMContentLoaded', function () {
        const imageInput = document.getElementById('imageInput');
        const imagePreviews = document.getElementById('imagePreviews');
        console.log('csdc',imagePreviews,imageInput);

        imageInput.addEventListener('change', function () {
          imagePreviews.innerHTML = ''; 

          const files = this.files;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (e) {
              const img = document.createElement('img');
              img.src = e.target.result;
              img.classList.add('preview-image');
              imagePreviews.appendChild(img);
            };

            reader.readAsDataURL(file);
          }
        });
      });



      function previewImageBanner(input) {
        const imagePreview = document.getElementById('imagePreviewBanner');
        const defaultImageURL = "/admin/assets/images/dashboard/add Image.webp";
      
        if (input.files && input.files[0]) {
          const reader = new FileReader();
      
          reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;
      
            img.onload = function () {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
      
              const maxWidth = 300; 
              const maxHeight = 300; 
      
              let width = img.width;
              let height = img.height;
      
              if (width > height) {
                if (width > maxWidth) {
                  height *= maxWidth / width;
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width *= maxHeight / height;
                  height = maxHeight;
                }
              }
      
              canvas.width = width;
              canvas.height = height;
      
              ctx.drawImage(img, 0, 0, width, height);
              imagePreview.src = canvas.toDataURL('image/jpeg');
            };
          };
      
          reader.readAsDataURL(input.files[0]);
        } else {
          imagePreview.src = defaultImageURL;
        }
      }
      