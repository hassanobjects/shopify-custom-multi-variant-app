var token = "TOKEN_PLACEHOLDER";
var shop = "SHOP_PLACEHOLDER";
var appDomain = "APP_DOMAIN";
var styleFilePath = "STYLE_FILE_PATH";

priceFormate = "";
cartItems = [];

var link = document.createElement( "link" );
link.href = styleFilePath;
link.type = "text/css";
link.rel = "stylesheet";
link.media = "screen,print";

document.getElementsByTagName( "head" )[0].appendChild( link );

// all variant rows container
customMultiVariantsContainer = document.createElement("div");
customMultiVariantsContainer.setAttribute("id", "custom_multi_variants_container");
customMultiVariantsContainer.classList.add("custom-multi-variants-container");

// add to cart btn
addToCartBtn = document.createElement("button");
addToCartBtn.disabled = true;
addToCartBtn.setAttribute("id", "custom_multi_variant_add_to_cart");
addToCartBtn.innerHTML = "Add To Cart";

// events
addToCartBtn.addEventListener("click", function(){
    addToCartHandler(this);
});

multiVariantSection = "";
if(meta && meta.page && meta.page.pageType && meta.page.pageType == 'product'){
    // get cart items
    var url = '/cart.js';
    var httpReq = new XMLHttpRequest();
    httpReq.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var response = httpReq.responseText;
            response = response.split('	').join('');
            response = response.split('\t').join('');
            response = JSON.parse(response);
            cartItems = response.items;
            console.log(cartItems);
        }
    };
    httpReq.open("GET", url, true);
    httpReq.setRequestHeader('Content-type', 'application/json');
    httpReq.send();

    // 
    var action = `${appDomain}/product-variants?shop=${shop}&token=${token}&product_id=${meta.page.resourceId}`;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
           multiVariantsHandler(xhttp.responseText);
        }
    };
    xhttp.open("GET", action, true);
    xhttp.send();
}else{
    
}

function multiVariantsHandler(response){
    response = response.split('	').join('');
	response = response.split('\t').join('');
    response = JSON.parse(response);
    const data = response.data;
    if(data && data.props && data.props && data.props.is_active){
        if(data.props.money_with_currency_format){
            priceFormate = data.props.money_with_currency_format;
        }

        // hide variant select part
        const variantSwitcher = document.querySelector('variant-radios') || document.querySelector('variant-selects');
        if(variantSwitcher){
            variantSwitcher.style.display = "none";
        }

        // hide quantity part
        const quantitySelect = document.querySelector('quantity-input').parentNode;
        if(quantitySelect){
            quantitySelect.style.display = "none";
        }

        // hide add to cart form
        const addToCartForms = document.querySelectorAll('form[action*="cart/add"]');
        for(var i = 0; i < addToCartForms.length; i++)
        {
            addToCartForms[i].style.display = "none";
        }

        if(data.product && data.product.variants){
            console.log('====================================');
            console.log(data.product);
            console.log('====================================');
            const addToCartForm = document.querySelector('form[action*="cart/add"]');
            addToCartForm.after(customMultiVariantsContainer);

            // add product title instead of variant title if not variants in that product
            let variantTitle = "";
            const productOptions = data.product.options;
            if(productOptions.length == 1 && productOptions[0].name == "Title"){
                variantTitle = data.product.title;
            }
            // ----------------------------------------------------------------//

            const productVariants = data.product.variants;
            let productImgSrc = data.product.image ? data.product.image.src : "";

            for(var i = 0; i < productVariants.length; i++)
            {   
                
                // let variantRow = createVariantRow(productVariants[i]);
                let variantObject = productVariants[i];
                variantObject.cartQty = 0;
                for (let index = 0; index < cartItems.length; index++) {
                    const element = cartItems[index];
                    if(element.product_id == data.product.id && element.variant_id == variantObject.id){
                        variantObject.cartQty = element.quantity;
                    }
                }
                // create variant row
                let variantRow = document.createElement("div");
                variantRow.classList.add("custom-multi-variant-row");
                variantRow.setAttribute("data-variant-id", variantObject.id);
                customMultiVariantsContainer.appendChild(variantRow);
                // ----------------------------------------------------------------//

                // create variant label
                let variantLabel = document.createElement("div");
                variantLabel.classList.add("custom-multi-variant-label");
                if(variantTitle != ""){
                    variantLabel.innerHTML = variantTitle;
                }else{
                    variantLabel.innerHTML = variantObject.title;
                }
                variantRow.appendChild(variantLabel);
                // ----------------------------------------------------------------//

                // create variant quantity and stock avaiablility
                let variantQuantity = document.createElement("div");
                variantQuantity.classList.add("custom-multi-variant-stock-availability");
                let variantAvailability = "In stock";
                let quantityInput = document.createElement("INPUT");
                quantityInput.classList.add("custom-multi-variant-quantity");
                quantityInput.setAttribute("data-variant-id", variantObject.id);
                quantityInput.addEventListener('change', function(){
                    changeAddToCartStatus(this);
                });

                let availableQty = variantObject.inventory_quantity - variantObject.cartQty;
                if(availableQty <= 0 && variantObject.inventory_policy == "deny"){
                    variantAvailability = "Out of stock";
                }else if(variantObject.inventory_policy == "continue"){
                    quantityInput.setAttribute("type", "number");
                    quantityInput.setAttribute("min", "0");
                    quantityInput.setAttribute("max", "999999");
                    variantRow.appendChild(quantityInput);
                }else if(availableQty > 0){
                    variantAvailability = `${availableQty} In stock`;
                    quantityInput.setAttribute("type", "number");
                    quantityInput.setAttribute("min", "0");
                    quantityInput.setAttribute("max", availableQty);
                    variantRow.appendChild(quantityInput);
                }
                variantQuantity.innerHTML = variantAvailability;
                variantRow.appendChild(variantQuantity);
                // ----------------------------------------------------------------//

                // create variant image
                let variantimgContainer = document.createElement("div");
                variantimgContainer.classList.add("custom-multi-variant-img-container");
                let variantimg = document.createElement("img");
                variantimg.classList.add("custom-multi-variant-img");
                variantimgContainer.appendChild(variantimg);
                let variantimgSrc = "DEFAULT_VARIANT_IMAGE";
                if(variantObject.image_id && data.product.images.length > 0){
                    for(var j = 0; j < data.product.images.length; j++){
                        if(variantObject.image_id == data.product.images[j].id){
                            variantimgSrc = data.product.images[j].src;
                            break;
                        }
                    }
                }else if(productImgSrc != ""){
                    variantimgSrc = productImgSrc;
                }
                variantimg.setAttribute("src", variantimgSrc);
                variantRow.appendChild(variantimgContainer);
                // ----------------------------------------------------------------//

                // create variant price
                let variantPrice = document.createElement("div");
                variantPrice.classList.add("custom-multi-variant-price");
                variantPrice.setAttribute("data-price-variant-id", variantObject.id);
                variantPrice.setAttribute("data-current-price", variantObject.price);
                variantPrice.setAttribute("data-basic-price", variantObject.price);
                variantPrice.innerHTML = formatedPrice(variantObject.price, priceFormate);
                variantRow.appendChild(variantPrice);
                // ----------------------------------------------------------------//

                const seperatedLine = document.createElement("HR");
                variantRow.appendChild(seperatedLine);
            }
            customMultiVariantsContainer.appendChild(addToCartBtn);
            // events
            addToCartBtn.addEventListener("click", function(){
                addToCartHandler(this);
            });
        }
        console.log('active');
    }else{
        console.log('inactive');
    }
}

var addToCartHandler = (btn) => {
    let quantityInputs = document.querySelectorAll('.custom-multi-variant-quantity');
    let items = [];
    for(var i = 0; i < quantityInputs.length; i++)
    {
        if(quantityInputs[i].value && quantityInputs[i].value > 0){
            items.push({"id" : quantityInputs[i].getAttribute("data-variant-id"), "quantity" : quantityInputs[i].value});
        }
    }
    if(items.length > 0){
        var http = new XMLHttpRequest();
        var url = '/cart/add.js';
        data = { items : items };
        http.open('POST', url, true);
        http.setRequestHeader('Content-type', 'application/json');
        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
            // var location =  window.location.origin+'/cart.js';
            console.log(window.location.origin+'/cart');
            window.location.href = window.location.origin+'/cart';
                console.log(http.responseText);
            }else{
            console.log(http);
            }
        }
        http.send(JSON.stringify(data));
    }else{
        alert('plz add qty of any variant');
    }
}

var changeAddToCartStatus = (input) => {
    let totalQty = getTotalQuantity();
    let addToCart = document.getElementById('custom_multi_variant_add_to_cart');
    let variantId = input.getAttribute("data-variant-id")
    if(totalQty > 0){
        addToCart.disabled = false;
    }else{
        addToCart.disabled = true;
    }
    updateItemPrice(variantId,input.value);
};

var getTotalQuantity = () => {
    let elements = document.getElementsByClassName("custom-multi-variant-quantity");
    let totalQty = 0;
    for (var i = 0; i < elements.length; i++) {
        if(elements[i].value){
            totalQty = totalQty + elements[i].value;
        }
    }
    return totalQty;
}

var updateItemPrice = (variant_id,Qty = 1) => {
    let priceElement = document.querySelector(`[data-price-variant-id='${variant_id}']`);
    console.log(Qty);
    if(priceElement && Qty > 0){
        let currentPrice = priceElement.getAttribute('data-current-price');
        let basicPrice = priceElement.getAttribute('data-basic-price');
        const newPrice = (Math.round(basicPrice * Qty * 100) / 100).toFixed(2);
        priceElement.setAttribute('data-current-price', newPrice);
        priceElement.innerHTML = formatedPrice(newPrice, priceFormate);
        // console.log(currentPrice);
        // console.log(basicPrice);
    }
    // console.log(priceElement);
    // console.log(variant_id);
    // console.log(Qty);
    // console.log(priceElement*Qty);
}

function createVariantRow(variant){
    console.log('====================================');
    console.log(variant);
    console.log('====================================');
}

function createMultiVariantSection(){

}

var formatedPrice = (price, formate="") => {
    if(formate){
        price = formate.replace('{{amount}}', price);
    }
    return price;
}

var checkCartExistsItems = () => {
    var url = '/cart.js';

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            return "ahmed";
        //    multiVariantsHandler(xhttp.responseText);
        }
    };
    xhttp.open("GET", url, true);
    xhttp.setRequestHeader('Content-type', 'application/json');
    xhttp.send();
}