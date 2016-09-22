angular.module('app.controllers', [])

        .controller('loginCtrl', function ($scope, $rootScope, $ionicHistory, sharedUtils, $state, $ionicSideMenuDelegate, fireBaseData) {
            $rootScope.extras = false;  // For hiding the side bar and nav icon

            // When the user logs out and reaches login page,
            // we clear all the history and cache to prevent back link
            $scope.$on('$ionicView.enter', function (ev) {
                if (ev.targetScope !== $scope) {
                    $ionicHistory.clearHistory();
                    $ionicHistory.clearCache();
                }
            });

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {

                    console.log('Usuário do tipo: ' + user.type);
                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $ionicSideMenuDelegate.canDragContent(true);  // Sets up the sideMenu dragable
                    $rootScope.extras = true;
                    sharedUtils.hideLoading();

                    var userType = user.type != undefined ? user.type : 'undefined';
                    userType = userType.toLocaleLowerCase();

                    switch (userType) {
                        case 'v':
                        { //vendedor
                            $state.go('homeRestaurant');
                            console.log('homeRestaurant');
                            break;
                        }
                        case 'p':
                        {
                            $state.go('homeUser');
                            console.log('homeUser');
                            break;
                        }
                        default:
                        {
                            console.log('sem tipo de usuário definido');
                            $state.go('chooseUserType');
                        }
                    }


                    // primeiro login do usuário, então precisa definir o tipo de usuário (vendedor ou comprador)
//                    if (user.type == undefined) {
//                        console.log('entrou aqui');
//                        $state.go('chooseUserType', {myVar: 'Hello Var'}, {localtion: "replace"});
//                        $state.prop1 = 'prop1';
//                        $scope.prop2 = 'prop2';
//                        $rootScope.myFunc = function () {
//                            console.log('Im my func')
//                        };
//                    } else {
//                        $state.go('menu2', {}, {location: "replace"});
//                    }

                }
            });

            $scope.loginEmail = function (formName, cred) {


                if (formName.$valid) {  // Check if the form data is valid or not

                    sharedUtils.showLoading();

                    //Email
                    firebase.auth().signInWithEmailAndPassword(cred.email, cred.password).then(function (result) {

                        //console.log(cred.email + " | " + cred.password);

                        // You dont need to save the users session as firebase handles it
                        // You only need to :
                        // 1. clear the login page history from the history stack so that you cant come back
                        // 2. Set rootScope.extra;
                        // 3. Turn off the loading
                        // 4. Got to menu page

                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $rootScope.extras = true;
                        sharedUtils.hideLoading();
                        $state.go('menu2', {}, {location: "replace"});

                    },
                            function (error) {
                                sharedUtils.hideLoading();
                                sharedUtils.showAlert("Ops!", "E-mail/senha inválidos");
                            }
                    );

                } else {
                    sharedUtils.showAlert("Please note", "Entered data is not valid");
                }



            };

            $scope.loginFb = function () {
                var provider = new firebase.auth.FacebookAuthProvider();
                provider.addScope('public_profile');
                console.log('login com FB');
                firebase.auth().signInWithRedirect(provider);
            };

            $scope.loginGmail = function () {
                //Gmail Login
            };

        })

        .controller('signupCtrl', function ($scope, $rootScope, sharedUtils, $ionicSideMenuDelegate,
                $state, fireBaseData, $ionicHistory) {
            $rootScope.extras = false; // For hiding the side bar and nav icon

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {

                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $ionicSideMenuDelegate.canDragContent(true);  // Sets up the sideMenu dragable
                    $rootScope.extras = true;
                    sharedUtils.hideLoading();
                    $state.go('menu2', {myProfile: 'controller signupCtrl'}, {location: "replace"}); // Zima - Aqui é pra onde vai depois do login

                }
            });

            $scope.signupEmail = function (formName, cred) {

                if (formName.$valid) {  // Check if the form data is valid or not

                    sharedUtils.showLoading();
                    if (cred.type == undefined) {
                        cred.type = 'P';
                    }
                    console.log(cred);

                    //Main Firebase Authentication part
                    firebase.auth().createUserWithEmailAndPassword(cred.email, cred.password).then(function (result) {

                        //Add name and default dp to the Autherisation table
                        result.updateProfile({
                            displayName: cred.name,
                            photoURL: "default_dp"
                        }).then(function () {}, function (error) {});

                        //Add phone number to the user table
                        fireBaseData.refUser().child(result.uid).set({
                            telephone: cred.phone,
                            type: cred.type
                        });

                        //Registered OK
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $ionicSideMenuDelegate.canDragContent(true);  // Sets up the sideMenu dragable
                        $rootScope.extras = true;
                        sharedUtils.hideLoading();
                        $state.go('menu2', {}, {location: "replace"});

                    }, function (error) {
                        console.log(error);
                        var msg = "Ocorre um erro, verifique o formulário.";
                        if (error.code == 'auth/email-already-in-use') {
                            msg = "E-mail já cadastrado no Big Food";
                        }
                        sharedUtils.hideLoading();
                        sharedUtils.showAlert("Ops!", msg);
                    });

                } else {
                    sharedUtils.showAlert("Please note", "Entered data is not valid");
                }

            }

            $scope.singupFacebook = function () {
                var provider = new firebase.auth.FacebookAuthProvider();
                provider.addScope('public_profile');

                firebase.auth().signInWithRedirect(provider);
            }

        })

        .controller('menu2Ctrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state,
                $ionicHistory, $firebaseArray, sharedCartService, sharedUtils) {

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    $scope.user_info = user; //Saves data to user_info

                } else {

                    $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
                    $ionicSideMenuDelegate.canDragContent(false);  // To remove the sidemenu white space

                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $rootScope.extras = false;
                    sharedUtils.hideLoading();
                    $state.go('tabsController.login', {}, {location: "replace"});
                }
            });

            // On Loggin in to menu page, the sideMenu drag state is set to true
            $ionicSideMenuDelegate.canDragContent(true);
            $rootScope.extras = true;

            // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
            $scope.$on('$ionicView.enter', function (ev) {
                if (ev.targetScope !== $scope) {
                    $ionicHistory.clearHistory();
                    $ionicHistory.clearCache();
                }
            });

            $scope.loadMenu = function () {
                sharedUtils.showLoading();
                $scope.menu = $firebaseArray(fireBaseData.refMenu());
                sharedUtils.hideLoading();
            }

            $scope.showProductInfo = function (id) {

            };
            $scope.addToCart = function (item) {
                sharedCartService.add(item);
            };
            $scope.myProfile = 'Hello World';

        })

        .controller('offersCtrl', function ($scope, $rootScope) {

            //We initialise it on all the Main Controllers because, $rootScope.extra has default value false
            // So if you happen to refresh the Offer page, you will get $rootScope.extra = false
            //We need $ionicSideMenuDelegate.canDragContent(true) only on the menu, ie after login page
            $rootScope.extras = true;
        })

        .controller('indexCtrl', function ($scope, $rootScope, sharedUtils, $ionicHistory, $state, $ionicSideMenuDelegate, sharedCartService) {

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    $scope.user_info = user; //Saves data to user_info

                    //Only when the user is logged in, the cart qty is shown
                    //Else it will show unwanted console error till we get the user object
                    $scope.get_total = function () {
                        var total_qty = 0;
                        for (var i = 0; i < sharedCartService.cart_items.length; i++) {
                            total_qty += sharedCartService.cart_items[i].item_qty;
                        }
                        return total_qty;
                    };

                } else {

                    $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
                    $ionicSideMenuDelegate.canDragContent(false);  // To remove the sidemenu white space

                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $rootScope.extras = false;
                    sharedUtils.hideLoading();
                    $state.go('tabsController.login', {}, {location: "replace"});

                }
            });

            $scope.logout = function () {

                sharedUtils.showLoading();

                // Main Firebase logout
                firebase.auth().signOut().then(function () {


                    $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
                    $ionicSideMenuDelegate.canDragContent(false);  // To remove the sidemenu white space

                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });


                    $rootScope.extras = false;
                    sharedUtils.hideLoading();
                    $state.go('tabsController.login', {}, {location: "replace"});

                }, function (error) {
                    sharedUtils.showAlert("Error", "Logout Failed")
                });

            }

        })

        .controller('myCartCtrl', function ($scope, $rootScope, $state, sharedCartService) {

            $rootScope.extras = true;

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {

                    $scope.cart = sharedCartService.cart_items;  // Loads users cart

                    $scope.get_qty = function () {
                        $scope.total_qty = 0;
                        $scope.total_amount = 0;

                        for (var i = 0; i < sharedCartService.cart_items.length; i++) {
                            $scope.total_qty += sharedCartService.cart_items[i].item_qty;
                            $scope.total_amount += (sharedCartService.cart_items[i].item_qty * sharedCartService.cart_items[i].item_price);
                        }
                        return $scope.total_qty;
                    };
                }
                //We dont need the else part because indexCtrl takes care of it
            });

            $scope.removeFromCart = function (c_id) {
                sharedCartService.drop(c_id);
            };

            $scope.inc = function (c_id) {
                sharedCartService.increment(c_id);
            };

            $scope.dec = function (c_id) {
                sharedCartService.decrement(c_id);
            };

            $scope.checkout = function () {
                $state.go('checkout', {}, {location: "replace"});
            };



        })

        .controller('lastOrdersCtrl', function ($scope, $rootScope, fireBaseData, sharedUtils) {

            $rootScope.extras = true;
            sharedUtils.showLoading();

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    $scope.user_info = user;

                    fireBaseData.refOrder()
                            .orderByChild('user_id')
                            .startAt($scope.user_info.uid).endAt($scope.user_info.uid)
                            .once('value', function (snapshot) {
                                $scope.orders = snapshot.val();
                                $scope.$apply();
                            });
                    sharedUtils.hideLoading();
                }
            });





        })

        .controller('favouriteCtrl', function ($scope, $rootScope) {

            $rootScope.extras = true;
        })

        .controller('settingsCtrl', function ($scope, $rootScope, fireBaseData, $firebaseObject,
                $ionicPopup, $state, $window, $firebaseArray,
                sharedUtils) {
            //Bugs are most prevailing here
            $rootScope.extras = true;

            //Shows loading bar
            sharedUtils.showLoading();

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {

                    //Accessing an array of objects using firebaseObject, does not give you the $id , so use firebase array to get $id
                    $scope.addresses = $firebaseArray(fireBaseData.refUser().child(user.uid).child("address"));

                    // firebaseObject is good for accessing single objects for eg:- telephone. Don't use it for array of objects
                    $scope.user_extras = $firebaseObject(fireBaseData.refUser().child(user.uid));

                    $scope.user_info = user; //Saves data to user_info
                    //NOTE: $scope.user_info is not writable ie you can't use it inside ng-model of <input>

                    //You have to create a local variable for storing emails
                    $scope.data_editable = {};
                    $scope.data_editable.email = $scope.user_info.email;  // For editing store it in local variable
                    $scope.data_editable.password = "";

                    $scope.$apply();

                    sharedUtils.hideLoading();

                }

            });

            $scope.addManipulation = function (edit_val) {  // Takes care of address add and edit ie Address Manipulator


                if (edit_val != null) {
                    $scope.data = edit_val; // For editing address
                    var title = "Editar endereço";
                    var sub_title = "Edite seu endereço de entrega";
                } else {
                    $scope.data = {};    // For adding new address
                    var title = "Adicionar endereço";
                    var sub_title = "Adicione um novo endereço de entrega";
                }
                // An elaborate, custom popup
                var addressPopup = $ionicPopup.show({
                    template: '<input type="text"   placeholder="Ex: Minha casa"  ng-model="data.nickname"> <br/> ' +
                            '<input type="text"   placeholder="Address" ng-model="data.address"> <br/> ' +
                            '<input type="number" placeholder="Pincode" ng-model="data.pin"> <br/> ' +
                            '<input type="number" placeholder="Phone" ng-model="data.phone">',
                    title: title,
                    subTitle: sub_title,
                    scope: $scope,
                    cssClass: 'zima-width-form-address',
                    buttons: [
                        {
                            text: '<b>Salvar</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                if (!$scope.data.nickname || !$scope.data.address || !$scope.data.pin || !$scope.data.phone) {
                                    e.preventDefault(); //don't allow the user to close unless he enters full details
                                } else {
                                    return $scope.data;
                                }
                            }
                        },
                        {text: 'Close'}
                    ]
                });

                addressPopup.then(function (res) {

                    if (edit_val != null) {
                        //Update  address
                        fireBaseData.refUser().child($scope.user_info.uid).child("address").child(edit_val.$id).update({// set
                            nickname: res.nickname,
                            address: res.address,
                            pin: res.pin,
                            phone: res.phone
                        });
                    } else {
                        //Add new address
                        fireBaseData.refUser().child($scope.user_info.uid).child("address").push({// set
                            nickname: res.nickname,
                            address: res.address,
                            pin: res.pin,
                            phone: res.phone
                        });
                    }

                });

            };

            // A confirm dialog for deleting address
            $scope.deleteAddress = function (del_id) {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Delete Address',
                    template: 'Are you sure you want to delete this address',
                    buttons: [
                        {text: 'No', type: 'button-stable'},
                        {text: 'Yes', type: 'button-assertive', onTap: function () {
                                return del_id;
                            }}
                    ]
                });

                confirmPopup.then(function (res) {
                    if (res) {
                        fireBaseData.refUser().child($scope.user_info.uid).child("address").child(res).remove();
                    }
                });
            };

            $scope.save = function (extras, editable) {
                //1. Edit Telephone doesnt show popup 2. Using extras and editable  // Bugs
                if (extras.telephone != "" && extras.telephone != null) {
                    //Update  Telephone
                    fireBaseData.refUser().child($scope.user_info.uid).update({// set
                        telephone: extras.telephone
                    });
                }

                //Edit Password
                if (editable.password != "" && editable.password != null) {
                    //Update Password in UserAuthentication Table
                    firebase.auth().currentUser.updatePassword(editable.password).then(function (ok) {}, function (error) {});
                    sharedUtils.showAlert("Account", "Password Updated");
                }

                //Edit Email
                if (editable.email != "" && editable.email != null && editable.email != $scope.user_info.email) {

                    //Update Email/Username in UserAuthentication Table
                    firebase.auth().currentUser.updateEmail(editable.email).then(function (ok) {
                        $window.location.reload(true);
                        //sharedUtils.showAlert("Account","Email Updated");
                    }, function (error) {
                        sharedUtils.showAlert("ERROR", error);
                    });
                }

            };

            $scope.cancel = function () {
                // Simple Reload
                $window.location.reload(true);
                console.log("CANCEL");
            }

        })

        .controller('supportCtrl', function ($scope, $rootScope) {

            $rootScope.extras = true;

        })

        .controller('forgotPasswordCtrl', function ($scope, $rootScope) {
            $rootScope.extras = false;
        })

        .controller('checkoutCtrl', function ($scope, $rootScope, sharedUtils, $state, $firebaseArray,
                $ionicHistory, fireBaseData, $ionicPopup, sharedCartService) {

            $rootScope.extras = true;

            //Check if user already logged in
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    $scope.addresses = $firebaseArray(fireBaseData.refUser().child(user.uid).child("address"));
                    $scope.user_info = user;
                }
            });

            $scope.payments = [
                {id: 'CREDIT', name: 'Credit Card'},
                {id: 'NETBANK', name: 'Net Banking'},
                {id: 'COD', name: 'COD'}
            ];

            $scope.pay = function (address, payment) {

                if (address == null || payment == null) {
                    //Check if the checkboxes are selected ?
                    sharedUtils.showAlert("Error", "Please choose from the Address and Payment Modes.")
                } else {
                    // Loop throw all the cart item
                    for (var i = 0; i < sharedCartService.cart_items.length; i++) {
                        //Add cart item to order table
                        fireBaseData.refOrder().push({
                            //Product data is hardcoded for simplicity
                            product_name: sharedCartService.cart_items[i].item_name,
                            product_price: sharedCartService.cart_items[i].item_price,
                            product_image: sharedCartService.cart_items[i].item_image,
                            product_id: sharedCartService.cart_items[i].$id,
                            //item data
                            item_qty: sharedCartService.cart_items[i].item_qty,
                            //Order data
                            user_id: $scope.user_info.uid,
                            user_name: $scope.user_info.displayName,
                            address_id: address,
                            payment_id: payment,
                            status: "Queued"
                        });

                    }

                    //Remove users cart
                    fireBaseData.refCart().child($scope.user_info.uid).remove();

                    sharedUtils.showAlert("Info", "Order Successfull");

                    // Go to past order page
                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $state.go('lastOrders', {}, {location: "replace", reload: true});
                }
            }



            $scope.addManipulation = function (edit_val) {  // Takes care of address add and edit ie Address Manipulator


                if (edit_val != null) {
                    $scope.data = edit_val; // For editing address
                    var title = "Edit Address";
                    var sub_title = "Edit your address";
                } else {
                    $scope.data = {};    // For adding new address
                    var title = "Add Address";
                    var sub_title = "Add your new address";
                }
                // An elaborate, custom popup
                var addressPopup = $ionicPopup.show({
                    template: '<input type="text"   placeholder="Nick Name"  ng-model="data.nickname"> <br/> ' +
                            '<input type="text"   placeholder="Address" ng-model="data.address"> <br/> ' +
                            '<input type="number" placeholder="Pincode" ng-model="data.pin"> <br/> ' +
                            '<input type="number" placeholder="Phone" ng-model="data.phone">',
                    title: title,
                    subTitle: sub_title,
                    scope: $scope,
                    buttons: [
                        {text: 'Close'},
                        {
                            text: '<b>Save</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                if (!$scope.data.nickname || !$scope.data.address || !$scope.data.pin || !$scope.data.phone) {
                                    e.preventDefault(); //don't allow the user to close unless he enters full details
                                } else {
                                    return $scope.data;
                                }
                            }
                        }
                    ]
                });

                addressPopup.then(function (res) {

                    if (edit_val != null) {
                        //Update  address
                        fireBaseData.refUser().child($scope.user_info.uid).child("address").child(edit_val.$id).update({// set
                            nickname: res.nickname,
                            address: res.address,
                            pin: res.pin,
                            phone: res.phone
                        });
                    } else {
                        //Add new address
                        fireBaseData.refUser().child($scope.user_info.uid).child("address").push({// set
                            nickname: res.nickname,
                            address: res.address,
                            pin: res.pin,
                            phone: res.phone
                        });
                    }

                });

            };


        })

        .controller('userTypeCtrl', function ($scope, $rootScope, $state, sharedUtils, fireBaseData) {

            firebase.auth().onAuthStateChanged(function (userLogged) {
                
            });

            $scope.goHome = function (user) {
                if (user.type == undefined) {
                    sharedUtils.showAlert("Atenção", "Escolha uma opção: vendedor ou comprador");
                } else {
                    var userType = user.type != undefined ? user.type : 'undefined';
                    userType = userType.toLocaleLowerCase();

                    switch (userType) {
                        case 'v':
                        { //vendedor
                            $state.go('homeRestaurant');
                            console.log('homeRestaurant');
                            break;
                        }
                        case 'p':
                        {
                            $state.go('homeUser');
                            console.log('homeUser');
                            break;
                        }
                        default:
                        {
                            console.log('sem tipo de usuário definido');
                            $state.go('chooseUserType');
                        }
                    }

                    // após passar pelo formulário de tipo de usuário, persiste no Firebase
                    var userLogged = fireBaseData.ref().auth().currentUser;
                    console.log('usuário...');
                    console.log(fireBaseData.ref().auth())
                    fireBaseData.refUser().child(userLogged.uid).set({
                        type: userType
                    });
                }
            }

        })

