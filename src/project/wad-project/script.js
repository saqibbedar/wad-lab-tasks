


// Quantity buttons
(function () {
    const decreaseBtn = document.getElementById('decrease');
    const increaseBtn = document.getElementById('increase');
    const qtyEl = document.getElementById('qty');

    let qty = 0;

    function updateQty() {
        qtyEl.textContent = qty;
        // decrease button only enabled when quantity is less than equal to zero
        decreaseBtn.disabled = qty <= 0;
    }

    decreaseBtn.addEventListener('click', function () {
        if (qty > 0) {
            qty = qty - 1;
            updateQty();
        }
    });

    increaseBtn.addEventListener('click', function () {
        qty = qty + 1;
        updateQty();
    });


    updateQty();
})();


