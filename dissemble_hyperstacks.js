for (imageIndex = 1; imageIndex <= nImages; imageIndex++) {
    // Activate the image
    selectImage(imageIndex);
    stackName = getTitle();

    saveAs("Tiff", "C:/Users/louie/Desktop/output/"+stackName+".tif");

    close();
}