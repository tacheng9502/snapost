jQuery(document).ready(function ($) {
    var newImageFile, userName, userImage, userId;

    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            window.location.href = 'https://snapost.herokuapp.com/';
        } else {
            userName = user.displayName;
            userImage = user.photoURL;
            userId = user.uid;
            $('#userInfo').html(
                '<img src="' + userImage + '" class="img-circle" width="30px">&nbsp;&nbsp;' +
                '<span>' + userName + '</span>'
            );
            showPost();
        }
    });

    $("#img_input").on('click', function () {
        var file = $(this).parent().parent().parent().find('.file');
        file.trigger('click');
    });

    $("#file").on("change", function (event) {
        $(this).parent().find('.form-control').val($(this).val().replace(/C:\\fakepath\\/i, ''));
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
        reader.onload = function (arg) {
            var img = '<img class="preview" width="400" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile = $('.preview').croppie({
                viewport: {
                    width: 600,
                    height: 600,
                    type: 'square'
                },
                boundary: {
                    width: 600,
                    height: 600
                }
            });
        }
    });

    window.dragHandler = function (e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
    }

    window.drop_image = function (e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
        var reader = new FileReader();
        reader.readAsDataURL(e.dataTransfer.files[0]); // 讀取檔案
        // 渲染至頁面
        reader.onload = function (arg) {
            var img = '<img class="preview" width="400" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile = $('.preview').croppie({
                viewport: {
                    width: 600,
                    height: 600,
                    type: 'square'
                },
                boundary: {
                    width: 600,
                    height: 600
                }
            });
        }

        window.sendUpdate = function (event) {
            event.preventDefault();
            var postKey = event.target.id.slice(0, -5);
            var date = new Date();
            var postTime = date.getTime();
            var postBody = $('#' + postKey + '_newBody').val();
            var postImage = $('#' + postKey + '_postImage').attr('src');

            var postData = {
                userId: userId,
                userName: userName,
                userImage: userImage,
                postBody: postBody,
                postTime: postTime,
                postImage: postImage
            };

            var updates = {};
            updates['/posts/' + postKey] = postData;
            firebase.database().ref().update(updates);
            showPost();
        }

        window.clickUpdate = function (event) {
            event.preventDefault();
            var updateId = event.target.id.slice(0, -7);

            $('#' + updateId + '_operate').html(
                '<button id="' + updateId + '_send" class="btn btn-default" onclick="sendUpdate(event)" >' +
                '<i id="' + updateId + '_send" class="fa fa-floppy-o" onclick="sendUpdate(event)" title="save"></i></a>'
            );
            var oldBody = $('#' + updateId + '_body').text();
            $('#' + updateId + '_body').html(
                '<textarea id="' + updateId + '_newBody" class="form-control" rows="3">' + oldBody + '</textarea>'
            );
        }

        window.clickDelete = function (event) {
            event.preventDefault();
            var postKey = event.target.id.slice(0, -7);

            swal({
                    title: "確認刪除留言?",
                    text: "刪除後留言將無法復原",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "刪除",
                    closeOnConfirm: false
                },
                function () {
                    var deletes = {};
                    deletes['/posts/' + postKey] = null;
                    firebase.database().ref().update(deletes);
                    swal("已刪除", "留言已經成功刪除", "success");
                    showPost();
                });
        }

        function showPost() {
            firebase.database().ref('posts').once("value", function (snapshot) {
                var array = [];
                snapshot.forEach(function (data) {
                    var post = {
                        postKey: data.key,
                        userId: data.val().userId,
                        userName: data.val().userName,
                        userImage: data.val().userImage,
                        postBody: data.val().postBody,
                        postTime: data.val().postTime,
                        postImage: data.val().postImage
                    };
                    array.push(post);
                });
                array = array.reverse();
                $('#list').children().remove();
                for (var i = 0; i < array.length; i++) {
                    var date = new Date(parseInt(array[i].postTime));
                    if (userId === array[i].userId) {
                        $('#list').append(
                            '<li>' +
                            '<div class="info"><a href="/profile?u=' + array[i].userId + '" >' +
                            '<img src="' + array[i].userImage + '" class="img-circle" width="25px">' +
                            '<h2 id="' + array[i].postKey + '_userName">' + array[i].userName + '</h2></a>' +
                            '<span class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() +
                            '/' +
                            date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() +
                            '</span>' +
                            '<div id="' + array[i].postKey + '_operate" class="navi pull-right">' +
                            '<button id="' + array[i].postKey +
                            '_update" class="btn btn-default" onclick="clickUpdate(event)" ><i id="' + array[i].postKey +
                            '_update" class="fa fa-pencil" onclick="clickUpdate(event)" title="edit"></i></button>&nbsp;' +
                            '<button id="' + array[i].postKey +
                            '_delete" class="btn btn-default" onclick="clickDelete(event)" ><i id="' + array[i].postKey +
                            '_delete" class="fa fa-trash" onclick="clickDelete(event)" title="delete"></i></button>' +
                            '</div></div>' +
                            '<p id="' + array[i].postKey + '_body">' + array[i].postBody + '</p>' +
                            '<img id="' + array[i].postKey + '_postImage" class="postImage" src="' + array[i].postImage + '"/>' +
                            '</li>'
                        );
                    } else {
                        $('#list').append(
                            '<li>' +
                            '<div class="info"><a href="/profile?u=' + array[i].userId + '" >' +
                            '<img src="' + array[i].userImage + '" class="img-circle" width="25px">' +
                            '<h2 id="' + array[i].postKey + '_userName">' + array[i].userName + '</h2></a>' +
                            '<span class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() +
                            '/' +
                            date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() +
                            '</span>' +
                            '</div>' +
                            '<p id="' + array[i].postKey + '_body">' + array[i].postBody + '</p>' +
                            '<img id="' + array[i].postKey + '_postImage" class="postImage" src="' + array[i].postImage + '"/>' +
                            '</li>'
                        );
                    }
                }

                $('.postImage').nailthumb({
                    width: 600,
                    height: 600,
                    method: 'resize',
                    fitDirection: 'center'
                });
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
        }

        $('#writeNewPost').on('click', function (event) {
            event.preventDefault();
            var newImagePNG;
            var postBody = $('#newPost_body').val();
            var date = new Date();
            var postTime = date.getTime();
            var newPostKey = firebase.database().ref().child('posts').push().key;
            var metadata = {
                contentType: 'image/jpeg'
            };

            newImageFile.croppie('result', {
                type: 'canvas',
                size: 'viewport'
            }).then(function (resp) {
                newImagePNG = resp;
            });

            var uploadTask = firebase.storage().ref().child('postImage/' + newPostKey).put(newImagePNG, metadata);
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
                function (snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED:
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING:
                            console.log('Upload is running');
                            break;
                    }
                },
                function (error) {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            // User doesn't have permission to access the object
                            break;
                        case 'storage/canceled':
                            // User canceled the upload
                            break;
                        case 'storage/unknown':
                            // Unknown error occurred, inspect error.serverResponse
                            break;
                    }
                },
                function () {
                    // Upload completed successfully, now we can get the download URL
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    // A post entry.
                    var postData = {
                        userId: userId,
                        userName: userName,
                        userImage: userImage,
                        postBody: postBody,
                        postTime: postTime,
                        postImage: downloadURL
                    };

                    // Write the new post's data simultaneously in the posts list and the user's post list.
                    var sets = {};
                    sets['/posts/' + newPostKey] = postData;

                    firebase.database().ref().update(sets);
                    $('.form-control').val("");
                    $('#newPost_body').val("");
                    $("#img_preview").empty();
                    newImageFile = null;
                    showPost();
                });
        });

        $('#clearNewPost').on('click', function (event) {
            event.preventDefault();
            $('.form-control').val("");
            $('#newPost_body').val("");
            $("#img_preview").empty();
            newImageFile = null;
        });

        $('#userInfo').on('click', function (event) {
            event.preventDefault();
            window.location.href = "/profile?u=" + userId;
        });
    };
})