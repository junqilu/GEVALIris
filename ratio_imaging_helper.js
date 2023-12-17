//Change the filename extension from .js to .ijm and then it can be installed into ImageJ

//All functions work in the background and the macros are callable from the outside (by either click on the function or the shortcut key--the key in the [])
//After each edit, you have to reinstall the macro file into the ImageJ to test them out

//Indexes that start from 0: ROI in the ROI manager, arrays
//Indexes that start from 1: slices in a stack






//Basic functions
//This section contains basic functions that will be used in other functions
function concatenate_array_by_character(input_array, input_character){
    resultString = ""; // Initialize an empty string to hold the concatenated result


    for (i = 0; i < lengthOf(input_array); i++) { // Loop through input_array and concatenate elements with input_character
        resultString += input_array[i];

        if (i < lengthOf(input_array) - 1) { // Add separator except for the last element
            resultString += input_character;
        }
    }

    return resultString;
}

function get_stack_name(){ //Obtain the stack name from the current window
    //This may not be reliable when you have multiple windows since it seems like to just get the title from the current activated window
    stack_title = getTitle();
    stack_name_array = split(stack_title, "."); //file_name is an array

    if (stack_name_array.length == 1){ //My image names won't have "." in the middle so the first item of stack_name_array is always the image name itself
        stack_name = stack_name_array[0];
    } else if (stack_name_array.length > 1){
        stack_name_array = Array.slice(stack_name_array, 0, stack_name_array.length-1); //Remove the last item of stack_name_array, which is usually the extension name
        // Array.print(stack_name_array); //For debugging

        stack_name = concatenate_array_by_character(stack_name_array, "."); //Other people's image names can have "." in the middle, so this is a way to restore those middle "."
    }else{
        //Do nothing
    }

    // print("Stack name is "+stack_name); //For debugging
    return stack_name;
}

function print_array(input_array) { //Iterate through input_array to print out each value. This is for debugging
    //Later I learned that you can use Array.print(input_array); for this purpose
    for (i = 0; i < input_array.length; i++) {
        print(input_array[i]);
    }
}

function append_to_array(input_array, append_value) { //ImageJ script seems to lack a very basic append to an array function
    // input_array = Array.concat(input_array, append_value); //This doesn't work in some places since JavaScript passes arrays by reference and this line doesn't modify the input_array in place. When you reassign input_array, it creates a new local variable that doesn't affect the original array

    output_array = newArray();

    for (i = 0; i < input_array.length; i++) {
        output_array[i] = input_array[i]; // Copy existing elements to the new array
    }
    output_array[input_array.length] = append_value; // Add the new element to the end
    return output_array; // Return the new array

}

function average_array_num(input_array_num) { //input_array_num is an array of numbers and this function return the average from those numbers
    if (input_array_num.length == 0) {
        return 0; // Return 0 for an empty array to avoid division by zero.
    } else {
        sum = 0;
        for (i = 0; i < input_array_num.length; i++) {
            sum += input_array_num[i];
        }
        return sum / input_array_num.length;
    }
}

function convert_to_32_bit() { //You have to do this to have float results (32-bit) on the heatmap after the image division
    run("32-bit"); //Convert image type from 16-bit to 32-bit. This applies to all the slices in the stack
}

function locate_image_by_regex(regex_str){//This function only outputs 1 unique image that matches regex_str
    found_match = false;

    images = getList("image.titles");
    for (i = 0; i < images.length; i++) { //Iterate through all opened images
        if (matches(images[i], regex_str)) {
            output_image = images[i];
            found_match = true;
        } else {
            //Do nothing
        }
    }

    if (found_match) {
        return output_image; //This should be a string for the image's name
    }else {
        return "No matched image was found!";
    }
}

function locate_images_by_regex(regex_str){//This function return s an array of images that match the regex_str
    found_images_array = newArray();

    images = getList("image.titles");
    for (i = 0; i < images.length; i++) { //Iterate through all opened images
        if (matches(images[i], regex_str)) {
            found_images_array = append_to_array(found_images_array, images[i]);
        } else {
            //Do nothing
        }
    }

    if (found_images_array.length > 0) {
        return found_images_array; //This should be a string for the image's name
    }else {
        return "No match imaged found!";
    }
}

function judge_substr_in_str(substr, str){ //Judge whether the str contains a substr
    if (matches(str, ".*"+substr+".*")){
        return true;

    }else {
        return false;
    }
}

function save_image (save_directory,image_name_str, format_str){
    //To keep things simple, image_name_str will be the image window's title but also the filename when save the image locally

    //Translate format_str into the corresponding file extension
    if (format_str == "Tiff") {
        file_extension = ".tif"; //This is the raw image format, and it has no colors. But it can be import back to ImageJ for further adjustment
    }else if (format_str == "Jpeg") {
        file_extension = ".jpg"; //This is for the display and presentation etc since it has colors. You can further adjust this image but it'll be different from what it looks like if you do it within ImageJ all the way without the exporting and importing
    } else {
        //Do nothing
        //You can keep adding more translation on the file formats here
    }

    saveAs(format_str, save_directory+image_name_str+file_extension);

    if (file_extension != ".jpg"){ //Only rename if file_extension is not ".jpg". This is because when you save an image as .jpg, it doesn't change the image window title. This inconsistency is very annoying and this special handling might cause some troubles in the future if the programmers of ImageJ fix this inconsistency
        rename_image(image_name_str+file_extension, image_name_str); //Rename the image back to get rid of the file extension part. This makes the referencing easier in later steps
    }
}

function save_images(save_directory,image_name_str, format_array){
    for (i = 0; i < format_array.length; i++){
        save_image(save_directory,image_name_str,format_array[i]);
    }
}


function rename_image(original_name_str, new_name_str) {
    if (original_name_str != new_name_str && isOpen(original_name_str)){ //You only rename the image if it is currently opened. This can avoid some errors
        selectImage(original_name_str);
        rename(new_name_str);
        return new_name_str;
    }else{
        print("No window for "+original_name_str+" was found so cannot rename it!");
        print("Your original_name_str is "+original_name_str);
        print("Your new_name_str is "+new_name_str);
        print("If your original_name_str and new_name_str are only different in a string for extension, you can ignore this");
    }
}

function merge_two_images (image_name_str_1, image_name_str_2){
    run("Merge Channels...", "c1=["+image_name_str_1+"] c2="+image_name_str_2+" create keep");
    //"create" means to check for "Create composite"
    //"keep" means to check for "Keep source images"

    new_image_name = rename_image("Composite", "Composite of "+image_name_str_1+" and "+image_name_str_2);
    return new_image_name; //By returning rename_image, I can relocate the image I want really easily
}



//Functions for file management
function obtain_desktop_directory(){//Obtain the string for desktop's directory on different computer
    path = getDirectory("home") + "Desktop\\";
    return path;
}

function judge_directory_exists(directory_str){
    if (File.isDirectory(directory_str)) {
        return true;
    } else {
        return false;
    }
}


function judge_make_directory(output_folder_name){ //Check whether output_folder_name is on the desktop and if not, make one on your desktop to store the later outputs from processing
    desktop_directory = obtain_desktop_directory();

    output_folder_directory = desktop_directory + output_folder_name + "\\"; //"\\" here ensures it's a folder

    if (judge_directory_exists(output_folder_directory)){
        //Lines below are commented out because they are part of the auto_everything function and I don't want to see the message box every time I process an image
        // Dialog.create("Output folder has been created!");
        // Dialog.addMessage("Output folder has already been created at directory: "+output_folder_directory);
    } else {
        File.makeDirectory(output_folder_directory);
    }

    return output_folder_directory;
}

macro "setup_output_folder [s]"{
    judge_make_directory("Fiji_output"); //Judge whether the desktop has a "Fiji_output" and if not, make that folder
    //If the folder is already there, nothing will happen
}





//Functions for better display and slice renaming
//These functions are automatic
function rename_slices(){
    filename = get_stack_name();

    //1st slice is the 405 nm image
    setSlice(1);
    run("Set Label...", "label=["+filename+"_405]");

    //2nd slice is the 488 nm image
    setSlice(2);
    run("Set Label...", "label=["+filename+"_488]");

    //3rd slice is the brightfield image
    if (nSlices > 2 ) { //This means you have a brightfield image in the stack
        setSlice(3);
        run("Set Label...", "label=["+filename+"_brightfield]");
    }
}

function display_with_auto_contrast() { //Make the stack better displayed (increase contrast for 405 and 488 images) without changing the raw data
    // The original method (below) doesn't work since the run("Enhance Contrast", "saturated=0.35"); line will still apply to all the images in a stack regardless of your run("Apply LUT", "slice"); line. So brightness and contrast adjustment might be part of the LUT
    // for (i = 1; i < nSlices + 1; i++) { //Iterate all slices
    //     //nSlices is the predefined variable that stores the total number of slices in a stack
    //     if (i <= 2) { //Skip the last slice, which is the bright-field
    //         setSlice(i);
    //         run("Enhance Contrast", "saturated=0.35"); //One time is enough for you to see
    //         //"saturated=0.35" is the default
    //         run("Apply LUT", "slice"); //Only apply the contrast adjustment to that slice rather than the whole stack
    //     }
    // }

    // New method--unstack the images, use locate_image_by_regex to locate the image, adjust the brightness and contrast, and then restack them up. Later I found out that you cannot do this since after the restacking, the images will have the same brightness and contrast setting
    // brightfield_img_avaialble = false;
    // if (nSlices > 2){
    //     brightfield_img_avaialble = true;
    // }
    //
    // run("Stack to Images"); //Unstack the slices
    //
    // img_405_name = locate_image_by_regex(".*405$");
    // img_488_name = locate_image_by_regex(".*488$");
    // img_name_array = newArray(img_405_name, img_488_name);
    //
    // for (i = 0; i < lengthOf(img_name_array); i++) {
    //     // Access the current string
    //     current_img_name = img_name_array[i];
    //     selectImage(current_img_name);
    //
    //     run("Enhance Contrast", "saturated=0.35"); //One time is enough for you to see
    //     // "saturated=0.35" is the default
    // }
    //
    // if (brightfield_img_avaialble == true){ //If you have the brightfield image, then you also adjust the brightness and contrast on that. This depends on how bad your brightfield image is but separating it from the rest of the images makes it easier to manipulate if needed
    //     brightfield_img_name = locate_image_by_regex(".*brightfield$");
    //     selectImage(brightfield_img_name);
    //
    //     run("Enhance Contrast", "saturated=0.35"); //One time is enough for you to see
    //     // "saturated=0.35" is the default
    // }
    //
    // run("Images to Stack", "use"); //Restack the images up

    //Just stick to the original adjustment as a primary step for you to see the images and then later once the stack is unstacked, you can adjust the brightfield image again
    for (i = 1; i < nSlices + 1; i++) { //Iterate all slices
        //nSlices is the predefined variable that stores the total number of slices in a stack
        if (i <= 2) { //Skip the last slice, which is the bright-field
            setSlice(i);
            run("Enhance Contrast", "saturated=0.35"); //One time is enough for you to see
            //"saturated=0.35" is the default

            // run("Apply LUT", "slice"); //Only apply the contrast adjustment to that slice rather than the whole stack. I commented this out since later I found out that clicking on the Apply will change the raw data on the image
        }
    }
}

macro "display_and_slice_renaming [d]" {
    rename_slices();
    display_with_auto_contrast();
    setSlice(2); //Go back to the 2nd slice for the Ex488 image, which should be the brightest so it's easier to select for the background
}





//Functions for background subtraction
//This step requires users to select out some areas of the background and the rest of it is automatic
macro "add_selection_to_ROI_manager [a]" { //Add current selection into ROI manager
    //If you don't have a selection before this function, you'll have an error
    run("Add Selection..."); //Add the selection to overlay but doesn't open the ROI manager and doesn't show you the update on the ROI manager
}

function measure_background() { //Iterate through all ROI (background areas selected by the user)
    run("To ROI Manager");
    ROI_count = roiManager("count"); //Obtain the total number of ROI in the manager

    ROI_array = newArray(ROI_count);
    for (i = 0; i < ROI_count; i++) { //Iterate through all ROI
        //All the ROIs' names are in the format of "count-4digit" so the original order of ROIs is correct
        roiManager("Select", i); //Select each ROI by order

        roiManager("Rename", "Background_" + i + 1); //Rename because the original name has a random 4-digit number as part of it. i+1 because the index should start from 1 from a biological perspective
        ROI_array[i] = i;
    }

    //print_array(ROI_array);

    roiManager("Select", ROI_array);
    roiManager("multi-measure measure_all"); //Measure all the ROI in all slices

    //Measurements will go to the measurement table
}

function average_background() {

    // Initialize an array to store the "Mean" values where "Slice" = 1
    mean_slice_1 = newArray();
    mean_slice_2 = newArray();

    for (row = 0; row < nResults; row++) { // Loop through the rows in the Results Table
        if (getResult("Slice", row) == 1) {
            mean_slice_1 = append_to_array(mean_slice_1, getResult("Mean", row));
        } else if (getResult("Slice", row) == 2) {
            mean_slice_2 = append_to_array(mean_slice_2, getResult("Mean", row));
        } else {
            //Do nothing when slice is 3
        }

    }

    avg_background_slice_1 = average_array_num(mean_slice_1);
    avg_background_slice_2 = average_array_num(mean_slice_2);

    print("Slice 1's average background is " + avg_background_slice_1);
    print("Slice 2's average background is " + avg_background_slice_2);

    return newArray(avg_background_slice_1, avg_background_slice_2); //ImageJ script language doesn't have something similar to dict
}

function subtract_background(input_avg_background_array) {
    for (i = 1; i < nSlices + 1; i++) { //Iterate all slices
        if (i <= 2) { //Skip the last slice, which is the bright-field
            setSlice(i);
            run("Subtract...", "value=" + input_avg_background_array[i - 1] + " slice"); //The slice option limits the changes to that specific slice
            //The index for the array uses [i - 1] here because the array indexes start from 0 but the indexes for slices in a stack start from 1
        }
    }
}

function force_close_roi_manager() {
    //Close ROI manager without that annoying window pop out
    roiManager("reset"); //Clean up ROI manager such that when you close the manager in the next line, there's no pop out window
    close("ROI Manager");
}

macro "clean_background [c]" {
    measure_background();

    avg_background = average_background();

    run("Select None"); //This deselect anything on the images. Without this line, the next line of subtracting the background will only occur within the last ROI

    subtract_background(avg_background);

    force_close_roi_manager();

    //The Results table and the Log are for debugging. Normally I don't need to see them since after the background subtraction, I can tell it's successful by seeing lots of 0-value pixels in the background
    close("Results");
    close("Log");
}





//Functions for set background to NaN
function median_filter(radius_num) { //Smooth out the fuzziness
    for (i = 1; i < nSlices + 1; i++) {
        if (i <= 2) { //Skip the last slice, which is the bright-field
            setSlice(i);
            run("Median...", "radius=" + radius_num + " slice"); //The slice option limits the changes to that specific slice
        }
    }
}

function set_background_to_NaN_core_by_thresholding() { // Set background pixels to NaN by thresholding
    /* setAutoThreshold("Otsu dark no-reset");
    run("NaN Background", "slice"); */
    //The lines above run things very fast without giving you a chance to adjust things manually so I commented them out

    run("Threshold..."); //This gives you a way to adjust the thresholding

    //Adjust the threshold
    waitForUser("Adjust the threshold and hit OK"); //Hitting OK will make the run the next line, which is to make the non-selected part as NaN automatically
    //The threshold window will also have an Apply button. Don't hit on that

    run("NaN Background", "slice");
    close("Threshold");
}

function set_background_to_NaN_core_by_manual(){ // Set background pixels to NaN by manual drawing
    setTool("freehand"); //Set the selection tool to freehand, which is the most commonly used tool for outline a cell

    waitForUser("Manually outline the cell and hit OK");

    run("Make Inverse"); //Select the outside of your cells, aka the background pixels

    run("Set...", "value=NaN slice"); //Set those background pixels as NaN

    run("Select None"); //Unselect everything to avoid confusion in the next step
}


macro "set_background_to_NaN [x]" {
    convert_to_32_bit(); //Be ready for the later image division. This allows the 32-bit data type, aka float, and also allows for the NaN data type
    median_filter(2); //Dave likes to use radius = 2 for the median filter

    // set_background_to_NaN_core_by_thresholding(); //This will give you very grainy outline skirts around the cells. But if you don't care about that, you can still use this function
    set_background_to_NaN_core_by_manual();
}







//Functions for image division and generating heatmap
function stack_to_images() {
    //Image calculator requires you to split a stack into slices
    run("Stack to Images"); // Split a stack into images
}

function image_division_image_calculator(input_image_str_1, input_image_str_2) { //This is the simpler ratio calculation of 2 images
    imageCalculator("Divide create 32-bit", input_image_str_1, input_image_str_2);
    //"Divide" means division
    //"create" means to check the box for "Create new window"
    //"32-bit" means to check the box for "32-bit (float) result". This is why you need to change the image type to 32-bit previously

    close("Image Calculator");
}

function image_division_ratio_plus(input_image_str_1, input_image_str_2){//This is the one demonstrated in the published GEVAL protocol
    //This function requires you to have Ratio Plus plug in installed first

    run("Ratio Plus", "image1=["+input_image_str_1+"] image2=["+input_image_str_2+"] background1=0 clipping_value1=0 background2=0 clipping_value2=0 multiplication=1"); //The multiplication = 2 is mentioned in the paper
    //The additional "[" and "]" is to handle special characters in the input_image_str_1 and input_image_str_2
}


function apply_LUT(input_image_str, LUT_name_str) {
    selectImage(input_image_str);
    run(LUT_name_str);

    run("Enhance Contrast...", "saturated=0.40 normalize"); //Do some auto-contrast. This is different from run("Enhance Contrast", "saturated=0.40");
    //"saturated" is default to be 0.35% but the GEVAL protocol requires a 0.4% saturation
    //"normalize" is also required by the GEVAL protocol but this is only on 1 ratio image (I tested here of with and without the normalize option and it seems like with the normalize here make sense in the final all heatmaps normalized together)
    //If you want to normalize several ratio images together you need to first combine them in a stack, so that the same minimum and maximum are applied to all ratio images uniformly
}

macro "heatmap_generation_and_save [h]" {
    stack_title = get_stack_name();

    stack_to_images(); //You have to split to use the image calculator

    image_1 = locate_image_by_regex(".*405$"); //Image's name ends with 405
    image_2 = locate_image_by_regex(".*488$"); //Image's name ends with 488

    //Choose which image division function you want to use
    //image_division_image_calculator(image_1, image_2); //This simply uses image calculator
    image_division_ratio_plus(image_1, image_2); //This uses the ratio plus plugin

    result_image = locate_image_by_regex("^Ratio.*"); //Image's name starts with "Ratio"
    apply_LUT(result_image, "16 colors"); //Apply the mpl-inferno style to the heatmap with some contrast adjustment

    // print(stack_title); // For debugging
    rename_image(result_image, "Heatmap of " + stack_title);

    save_directory = judge_make_directory("Fiji_output");
    image_name_str = locate_image_by_regex("^Heatmap.*");
    format_array = newArray("Tiff", "Jpeg");
    save_images(save_directory, image_name_str, format_array);
}



// Below are additional functions to generate histogram and data for quantification check and comparison
function histogram_data_generation_and_save(bins_num, input_stack_name){ //This should be equivalent to you click on the ratio heatmap, click Analyze -> Histogram -> List, and save the pop out result data table locally

    getHistogram(values, counts, bins_num); //Here a stack histogram with bins_num
    // values and counts are the things that you'll be using below to output the .csv

    //Table creation and saving
    Table.create("histogram_data");
    Table.setColumn("bin_start", values); //Column with histogram values. I use "bin_start" to be the same as if you use the GUI to output the data
    Table.setColumn("count", counts); //Column with histogram counts. I use "count" to be the same as if you use the GUI to output the data

    save_directory = judge_make_directory("Fiji_output");
    if (input_stack_name == "individual img"){
        heatmap_image = locate_image_by_regex("^Heatmap.*");
        stack_name = substring(heatmap_image, 11, lengthOf(heatmap_image)); //Remove the "Heatmap of " from beginning to get the stack_name
    }else{
        stack_name = input_stack_name;
    }

    FileName = "histogram_data_for_"+stack_name+ ".csv";
    saveAs("Results", save_directory + "\\"+ FileName);

    close(FileName); //Close the window for the histogram data
}

function histogram_image_generation_and_save(bins_num, input_stack_name){
    run("Histogram", "bins="+bins_num+" use x_min=0 x_max=1 y_max=Auto"); //Generate the histogram from the GUI
    // "x_min=0 x_max=1" because this is the ratio heatmap and all the ratios are between 0 and 1

    save_directory = judge_make_directory("Fiji_output");
    if (input_stack_name=="individual img"){
        heatmap_image = locate_image_by_regex("^Heatmap.*");
        stack_name = substring(heatmap_image, 11, lengthOf(heatmap_image)); //Remove the "Heatmap of " from beginning to get the stack_name
    }else{
        stack_name = input_stack_name;
    }

    FileName = "histogram_image_for_"+stack_name+ ".tif";
    saveAs("Tiff", save_directory + "\\"+ FileName);

    close(FileName); //Close the window for the histogram GUI
}

macro "histogram_data_and_image_save"{
    bins_num = 256; // bins_num is default to be 256 (16 × 16) and I like this number. It's basically the number of columns in your histogram
    histogram_data_generation_and_save(bins_num, "individual img"); //ImageJ  macro language doesn't support optional argument so this is a circumvent. For generating histogram on the run, just use "individual img". For batch image processing, use the filename of the iterated file to replace the "individual img"

    histogram_image_generation_and_save(bins_num, "individual img");
}


//Functions for merging heatmap and bright-field
macro "overlay_heatmap_on_brightfield_and_save [o]"{
    heatmap_image = locate_image_by_regex("^Heatmap.*");
    brightfield_image = locate_image_by_regex(".*brightfield$");

    if (brightfield_image != "No matched image was found!"){
        selectImage(brightfield_image);
        run("Enhance Contrast", "saturated=0.35"); //Now that brightfield is separated from the rest of the images, you can do this adjustment on it

        heatmap_merge_brightfield_image = merge_two_images(heatmap_image, brightfield_image);

        save_directory = judge_make_directory("Fiji_output");
        image_name_str = locate_image_by_regex(heatmap_merge_brightfield_image);
        format_array = newArray("Tiff", "Jpeg");
        save_images(save_directory, image_name_str, format_array);
        close(heatmap_merge_brightfield_image);
    }
}



//Functions for making and saving the montage
macro "montage_generation_and_save [m]" {
    //Try to reobtain the stack_name from the heatmap's image name
    heatmap_image = locate_image_by_regex("^Heatmap.*");

    stack_name = substring(heatmap_image, 11, lengthOf(heatmap_image)); //Remove the "Heatmap of " from beginning to get the stack_name

    if (nImages > 3){
        run("Merge Channels...", "c1=["+stack_name+"_405] c2=["+stack_name+"_488] c3=["+stack_name+"_brightfield] c4=[Heatmap of "+stack_name+"] create keep");
        //Making merge channel image is the only way to have different LUT on different slices of a stack
    } else{
        run("Merge Channels...", "c1=["+stack_name+"_405] c2=["+stack_name+"_488] c3=[Heatmap of "+stack_name+"] create keep");
    }


    //Rename slices
    //1st slice is the 405 nm image
    setSlice(1);
    run("Set Label...", "label=["+stack_name+"_405]");

    //2nd slice is the 488 nm image
    setSlice(2);
    run("Set Label...", "label=["+stack_name+"_488]");


    if (nImages > 5){
        //3rd slice is the brightfield image
        setSlice(3);
        run("Set Label...", "label=["+stack_name+"_brightfield]");

        //4th slice is the ratio heatmap
        setSlice(4);
        run("Set Label...", "label=["+stack_name+"_heatmap]");
    } else{
        //4th slice is the ratio heatmap
        setSlice(3);
        run("Set Label...", "label=["+stack_name+"_heatmap]");
    }

    Stack.setDisplayMode("color"); //Change the display mode from composite to color so the 1st image of the montage result is correct. This doesn't change the image type

    if (nSlices > 3){
        run("Make Montage...", "columns=2 rows=2 scale=1 label");
        //"label" means label the montage using the slice names
        //The resulting montage will be a RGB image
    }else{
        run("Make Montage...", "columns=3 rows=1 scale=1 label");
        //"label" means label the montage using the slice names
        //The resulting montage will be a RGB image
    }



    montage_filename = "Montage of "+stack_name;
    rename_image("Montage", montage_filename);

    save_directory = judge_make_directory("Fiji_output");
    image_name_str = locate_image_by_regex("^Montage.*");
    format_array = newArray("Tiff", "Jpeg");
    save_images(save_directory, image_name_str,format_array);
    close(montage_filename);
}



//Functions for finishing things up
function save_processed_stack(){
    //Try to reobtain the stack_name from the heatmap's image name
    heatmap_image = locate_image_by_regex("^Heatmap.*");
    stack_name = substring(heatmap_image, 11, lengthOf(heatmap_image)); //Remove the "Heatmap of " from beginning to get the stack_name

    processed_stack_name = "Processed stack of "+stack_name;
    rename_image("Composite", processed_stack_name);

    save_directory = judge_make_directory("Fiji_output");
    format_array = newArray("Tiff"); //The thumbnail will look crappy but if you import the .tif back in ImageJ, you can still edit it as you like
    save_images(save_directory, processed_stack_name, format_array);
    close(processed_stack_name);
}

macro "finish_up [f]"{
    save_processed_stack();

    heatmap_image = locate_image_by_regex("^Heatmap.*");
    heatmap_image_name_array = split(heatmap_image, "of ");
    stack_name = heatmap_image_name_array[1];

    //Close up all remaining windows from processing this stack
    close_windows_array = locate_images_by_regex("^"+stack_name+".*");
    close_windows_array = append_to_array(close_windows_array, heatmap_image);
    for(i = 0; i < close_windows_array.length; i++){
        close(close_windows_array[i]);
    }
}


//Functions to auto the whole process together
macro "auto_everything [z]" {
    run("setup_output_folder [s]");

    run("display_and_slice_renaming [d]");

    setTool("rectangle"); //Change the selection tool to rectangle which is the most commonly used tool for selecting the background
    waitForUser("Once you finish adding selection for background with shortcut key [a], click OK");

    run("clean_background [c]");

    run("set_background_to_NaN [x]");

    run("heatmap_generation_and_save [h]");

    run("histogram_data_and_image_save");

    if (nImages > 3) { //Only overlay the heatmap on brightfield when you have the brightfield (nImages = 4 in this case)
        run("overlay_heatmap_on_brightfield_and_save [o]");
    }

    run("montage_generation_and_save [m]");

    run("finish_up [f]");
}




//Functions to normalize all the ratio heatmaps
function pick_a_directory(){
    path = getDirectory("Choose a Directory"); //This will open the file dialogue

    return path;
}

function filter_files(input_directory_str, regex_str){
    file_list = getFileList(input_directory_str);
    output_file_array = newArray();

    // Loop through the files and open the ones that match the regex pattern
    for (i = 0; i < file_list.length; i++) {
        if (matches(file_list[i], regex_str)) {
            output_file_array = append_to_array(output_file_array, input_directory_str + "\\" +file_list[i]);

        }
    }

    return output_file_array;
}

function batch_open_files(file_directories_array){
    for (i = 0; i < file_directories_array.length; i++) {
        open(file_directories_array[i]);
    }
}

function normalize_heatmaps (){
    run("Images to Stack", "use"); //Make the stack
    run("Enhance Contrast...", "saturated=0.4 normalize");
}

function rename_heatmaps(){
    rename_image("Stack", "Normalized heatmaps");
    for (i = 1; i < nSlices + 1; i++) { //Rename slices of the stack
        setSlice(i);
        old_slice_name = getInfo("slice.label");
        new_slice_name = replace(old_slice_name, "Heatmap", "Normalized heatmap");
        run("Set Label...", "label=["+new_slice_name+"]");
    }
}

macro "normalize_and_save_heatmaps [n]" {
    input_folder_directory = pick_a_directory(); //Ask user to locate the folder that contains all the ratio heatmaps

    heatmap_files_array = filter_files(input_folder_directory, "^Heatmap.*.tif$");

    batch_open_files(heatmap_files_array);

    normalize_heatmaps(); //This normalizes all the heatmaps

    rename_heatmaps();

    save_directory = judge_make_directory("Fiji_output\\normalized heatmaps");
    normalized_heatmaps_stack_name = "Normalized heatmaps";
    heatmap_stack_format_array = newArray("Tiff");
    save_images(save_directory, normalized_heatmaps_stack_name, heatmap_stack_format_array);

    run("Stack to Images");

    normalized_heatmaps = locate_images_by_regex("^Normalized heatmap.*");
    heatmap_format_array = newArray("Tiff", "Jpeg");
    for (i = 0; i < normalized_heatmaps.length; i++) { //Save each images into a folder
        selectImage(normalized_heatmaps[i]); //You must select that image to activate. Otherwise, you'll have the same image saved several times with different file names
        save_images(save_directory, normalized_heatmaps[i], heatmap_format_array);
        close(normalized_heatmaps[i]);
    }
}



// Functions to batch process images
// For all these functions, please follow the pattern of asking the user to select an input folder to generate an array of file directories, iterate through the array to open the image, process, output, and close the image. Doing this (rather than opening all the images at once and process them one by one) can avoid memory crowd up issues, which can lead to weird behaviours like the loop always stop at the half way

// Functions to batch output histogram data and histogram generated by ImageJ GUI
function output_histogram_data_and_img(input_file_directory){
    open(input_file_directory);

    heatmap_image = get_stack_name();
    stack_name = substring(heatmap_image, 11, lengthOf(heatmap_image));

    bins_num = 256; // bins_num is default to be 256 (16 × 16) and I like this number. It's basically the number of columns in your histogram
    histogram_data_generation_and_save(bins_num, stack_name);
    histogram_image_generation_and_save(bins_num, stack_name);

    close(heatmap_image+".tif"); //Close the image
}

macro "batch_output_histogram_data_and_img" {
    input_folder_directory = pick_a_directory(); //Ask user to locate the folder that contains all the ratio heatmaps
    heatmap_files_array = filter_files(input_folder_directory, "^Heatmap.*.tif$");

    for (i = 0; i < lengthOf(heatmap_files_array); i++) {
        file_directory = heatmap_files_array[i];

        output_histogram_data_and_img(file_directory);
    }
}









