// Thanks, StackOverflow!

function isNumericInput(event) {
  const key = event.keyCode;
  return ((key >= 48 && key <= 57) || // Allow number line
      (key >= 96 && key <= 105) // Allow number pad
  );
};

function isModifierKey(event) {
  const key = event.keyCode;
  return (event.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
      (key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
      (key > 36 && key < 41) || // Allow left, up, right, down
      (
          // Allow Ctrl/Command + A,C,V,X,Z
          (event.ctrlKey === true || event.metaKey === true) &&
          (key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
      )
};

// Input must be a valid integer or modifier key, and not longer than ten digits
function enforceFormat(event) {
  if (!isNumericInput(event) && !isModifierKey(event)) {
      event.preventDefault();
  }
};

function formatToPhone(event) {
  if (isModifierKey(event)) {
    return;
  }

  const target = event.target;
  const input = target.value.replace(/\D/g,'').substring(0,10); // First ten digits of input only
  const area = input.substring(0,3);
  const firstThree = input.substring(3,6);
  const lastFour = input.substring(6,10);

  if (input.length > 6) {
    target.value = `(${area}) ${firstThree}-${lastFour}`;
  } else if (input.length > 3) {
    target.value = `(${area}) ${firstThree}`;
  } else if (input.length > 0) {
    target.value = `(${area}`;
  }
};

const phoneField = document.getElementById('user_phone');
phoneField.addEventListener('keydown',enforceFormat);
phoneField.addEventListener('keyup',formatToPhone);
