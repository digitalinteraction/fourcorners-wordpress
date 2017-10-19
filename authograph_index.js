(function () {
    tinymce.create("tinymce.plugins.authograph_button_plugin", {

        //url argument holds the absolute url of our plugin directory
        init: function (ed, url) {

            //add new button   
            ed.addButton("Authograph", {
                title: "Insert Four Corners",
                cmd: "authograph_command",
                image: authograph_php.plugin_url + "fourcorners-logo-150x150.png"
            });

            //button functionality.
            ed.addCommand("authograph_command", function () {
                var selected_text = ed.selection.getContent();
                var new_image = true;
                var selected_element = ed.selection.getNode();
                var script_element = [];
                if (selected_element != null && selected_element.getAttribute('data-4c') != null) {
                    script_element = (findImgScript(selected_element.getAttribute('data-4c')));
                    new_image = (script_element.length == 0);
                } else {
                    new_image = true;
                }

                if (new_image)
                    create_new_image();
                else
                    edit_4c_image();

                function edit_4c_image() {
                    var image_url = selected_element.getAttribute('src');
                    var image_name = selected_element.getAttribute('data-4c');
                    var data_recieved = false;

                    var tb_frame = authograph_php.plugin_url + "/editor/?TB_iframe=true";
                    tb_show("Four Corners - Metadata Editor", tb_frame);

                    var iframe = jQuery("iframe#TB_iframeContent")[0];
                    window.addEventListener("message", receiveMetadata, false);
                    function receiveMetadata(event) {
                        tb_remove();
                        if (!data_recieved) {
                            data_recieved = true;
                            var scriptData = event.data;
                            var return_text = '<img data-4c="' + image_name + '" src="' + image_url + '"/>';
                            return_text += "<br /><script data-4c-meta='" + image_name + "' type='text/json'>" + scriptData + "</script>";
                            script_element.forEach(function(n){ n.remove()});
                            ed.execCommand("mceInsertContent", 0, return_text);
                        }
                        return;
                    }

                    jQuery("iframe#TB_iframeContent").load(function () {
                        var obj = JSON.parse(jQuery(urldecode(script_element[0].getAttribute('data-wp-preserve'))).html());
                        obj.url = image_url;
                        iframe.contentWindow.postMessage(JSON.stringify(obj), "*");
                    });
                }

                function create_new_image() {
                    var image = wp.media({
                        title: 'Upload Image',
                        multiple: false,
                        default_tab: 'upload'

                    }).open()
                        .on('select', function (e) {

                            // This will return the selected image from the Media Uploader, the result is an object
                            var uploaded_image = image.state().get('selection').first();
                            // We convert uploaded_image to a JSON object to make accessing it easier
                            // Output to the console uploaded_image
                            var image_url = uploaded_image.toJSON().url;
                            var image_name = uploaded_image.toJSON().filename;
                            var image_id = uploaded_image.toJSON().id;
                            var data_recieved = false;
                            script_element = findImgScript('xmp_' + image_name);
                            

                            // var return_text = '<img data-4c="xmp_'+image_name+'" src="'+image_url+'"/>';

                            //display editor
                            var tb_frame = authograph_php.plugin_url + "/editor/?TB_iframe=true"; //"wp-authograph-editor.php?TB_iframe=true";
                            // var tb_frame = "https://digitalinteraction.github.io/fourcorners-editor/?TB_iframe=true"; //"wp-authograph-editor.php?TB_iframe=true";

                            tb_show("Four Corners - Metadata Editor", tb_frame);

                            var iframe = jQuery("iframe#TB_iframeContent")[0];

                            //register event listener for getting resulting data from editor
                            window.addEventListener("message", receiveMetadata, false);
                            function receiveMetadata(event) {
                                tb_remove();
                                if (!data_recieved) {
                                    data_recieved = true;
                                    var scriptData = event.data;
                                    var return_text = '<img data-4c="xmp_' + image_name + '" src="' + image_url + '"/>';
                                    return_text += "<br /><script data-4c-meta='xmp_" + image_name + "' type='text/json'>" + scriptData + "</script>";
                                    ed.execCommand("mceInsertContent", 0, return_text);
                                }
                                return;
                            }

                            //get pre-existing metadata from the image using wordpress api
                            jQuery.get("/wp-json/wp_authograph/metadata/" + image_id, function (data, status) {
                                var obj = (script_element.length > 0) ? JSON.parse(jQuery(urldecode(script_element[0].getAttribute('data-wp-preserve'))).html()) : JSON.parse(data);
                                obj.url = image_url;
                                if (script_element.length > 0) script_element.forEach(function(n){ n.remove()});
                                iframe.contentWindow.postMessage(JSON.stringify(obj), "*");
                            });
                        })
                }

                function findImgScript(tag) {
                    var scriptElement = [];
                    var scriptArray = ed.dom.select('img.mce-object[alt="<script>"]')
                    scriptArray.forEach(function (script) {
                        if (jQuery(urldecode(script.getAttribute('data-wp-preserve'))).attr('data-4c-meta') == tag) {
                            scriptElement.push(script);
                        }
                    });
                    return scriptElement;
                }

                function urldecode(url) {
                    return decodeURIComponent(url.replace(/\+/g, ' '));
                }
            });

        },

        createControl: function (n, cm) {
            return null;
        },

        getInfo: function () {
            return {
                longname: "Four Corners Button",
                author: "Tom Bartindale",
                version: "1"
            };
        }
    });

    tinymce.PluginManager.add("authograph_button_plugin", tinymce.plugins.authograph_button_plugin);
})();