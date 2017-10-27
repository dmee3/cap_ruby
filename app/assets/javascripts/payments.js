// Calculate and display service fee every time the Amount box is updated
$('#payment_amount').on('change', function(event) {
  var amount = $('#payment_amount').val();
  if (amount > 0.5) {
    var total = calculateCost(amount);
    var fee = total - amount;
    $('#payment_amount').removeClass('invalid');
    $('#service-fee').html('+ $' + fee.toFixed(2) + ' <small class="font-weight-light">(Service Fee)</small>');
    $('#total-cost').html('= <strong>$' + total + '</strong> <small class="font-weight-light">(Total)</small>');
  } else {
    $('#payment_amount').addClass('invalid');
    $('#service-fee').text('');
    $('#total-cost').text('');
  }
});

// Create a Stripe client and Elements instance
var stripe = Stripe('pk_test_Jsmvc6lI1rcpBPT5bFk9pHJU');
var elements = stripe.elements();

// Create an instance of the card Element and add it to the `card-element` div
var card = elements.create('card', {
  style: {
    base: {
      color: '#495057',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#dc3545',
      iconColor: '#dc3545'
    }
  }
});
card.mount('#card-element');

// Handle real-time validation errors from the card Element.
card.on('change', function(event) {
  if (event.error) {
    $('#card-errors').text(event.error.message);
  } else {
    $('#card-errors').text('');
  }
});

// Create a token or display an error when the form is submitted.
$('#payment-form').on('submit', function(event) {
  event.preventDefault();

  // Ensure amount is greater than $5
  var amount = $('#payment_amount').val();
  if (amount == '' || amount < 5) {
    $('#card-errors').text('The minimum payment amount is $5.');
    return;
  }

  stripe.createToken(card).then(function(result) {
    if (result.error) {
      $('#card-errors').text(result.error.message);
    } else {
      stripeTokenHandler(result.token);
    }
  });
});

function calculateCost(charge_amount) {
  return (charge_amount / 0.971 + 0.3).toFixed(2);
}

function stripeTokenHandler(token) {
  // Insert the token ID into the form
  $('<input type="hidden">').attr({
    name: 'stripe_token',
    value: token.id
  }).appendTo('#payment-form');

  // Insert the charge amount into the form
  var charge = Math.floor(calculateCost($('#payment_amount').val()) * 100);
  $('<input type="hidden">').attr({
    name: 'charge_amount',
    value: charge
  }).appendTo('#payment-form');

  document.getElementById('payment-form').submit();
}