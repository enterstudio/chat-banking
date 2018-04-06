/**
 * Created by mayujain on 12/4/17.
 */

/*
 * Disables page scrolling.
 */
document.body.addEventListener('touchmove', function (e) {
    e.preventDefault();
});

/*
 * Inserts given character at the specified position(index) in the string.
 */
String.prototype.insertAt = function (index, string) {
    return this.substr(0, index) + string + this.substr(index);
};

$(function () {

    $('#card_number').bind("cut copy paste", function (e) {
        e.preventDefault();
    });

    /*
     * Validates Card Number, removes non-numeric characters and inserts space after every 4 digits for readability
     * */
    document.getElementById('card_number').addEventListener('input', (e) => {
        let target = e.target;
        target.value = target.value.replace(/[^\dA-Z]/g, '').replace(/(.{4})/g, '$1 ').trim();
        if (target.value.length == 19) {
            document.getElementById("cvv").select();
        }
    });

    /*
     * Validates Card CVV
     * */
    document.getElementById('cvv').addEventListener('input', (e) => {
        let target = e.target;
        target.value = target.value.replace(/[^\dA-Z]/g, '').trim();
        if (target.value && target.value.length == 3) {
            // Some CVVs start with zeroes. To prevent removal of leading zeroes
            // not treating CVV as number.
            // target.value = parseInt(target.value);
            document.getElementById("card_expiration").select();
        }
    });

    /*
     * Validates Card Expiry Date
     * */
    document.getElementById('card_expiration').addEventListener('input', (e) => {
        let target = e.target;
        target.value = target.value.replace(/[^\dA-Z]/g, '').trim();

        if (target.value.substring(0, 2) > 12) {
            target.value = target.value.substring(0, target.value.length - 1);
            document.getElementById("card_expiration").select();
        }
        else if (target.value.length > 2 && target.value.length < 6) {
            target.value = target.value.insertAt(2, "/");
        }
        else if (target.value.length == 6) {
            target.value = target.value.insertAt(2, "/");
            document.getElementById("zipCode").select();
        }
    });

    /*
     * Validates ZipCode
     * */
    document.getElementById('zipCode').addEventListener('input', (e) => {
        let target = e.target;
        target.value = target.value.replace(/[^\dA-Z]/g, '').trim();
        if (target.value && target.value.length == 5) {
            target.value = parseInt(target.value);
            setTimeout(() => {
                $('#footer').removeClass('hide-footer');
                $('#connect-button').focus();
            }, 200)
        }
    });

});

function enrollCard(user_id) {
    let formFields = {};

    //get input values from the form
    $.each($('#enrollCardForm').serializeArray(), function (i, field) {
        formFields[field.name] = field.value;
    })

    if(formFields.card_number && formFields.cvv && formFields.card_expiration && formFields.zipCode){

        formFields.card_number = String(formFields.card_number).replace(/[^0-9]/g, '');
        formFields.expiry_month = formFields.card_expiration.split("/")[0];
        formFields.expiry_year = formFields.card_expiration.split("/")[1];
        delete formFields.card_expiration;
        formFields.fb_user_id = user_id; //add user's fb id to the request object

        let errorMessageDiv = $(".errorMessage");
        errorMessageDiv.empty().hide();

        $.ajax({
            url: '/verify',
            type: 'POST',
            data: JSON.stringify(formFields),
            contentType: "application/json",
            success: function (data) {
                MessengerExtensions.requestCloseBrowser(function success() {}, function error(err) {});
                window.close();  //if MessengerExtensions does not close
            },
            error: function (error) {
                let responseJSON = error.responseJSON;
                let errorMessageDiv = $(".errorMessage");
                errorMessageDiv
                    .empty()
                    .show()
                    .append(`<span>Sorry ${responseJSON.first_name}. Try verifying your credit card details again.</span>`);
            }
        });

        formFields = null; //Delete all card information
    }
}
