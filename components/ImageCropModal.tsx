"use client";
import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from './ui/button';

interface ImageCropModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imgSrc: string;
    onCropComplete: (croppedBase64: string) => void;
}

export function ImageCropModal({ open, onOpenChange, imgSrc, onCropComplete }: ImageCropModalProps) {
    const [crop, setCrop] = useState<Crop>();
    const imgRef = useRef<HTMLImageElement>(null);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: 'px',
                    width: 150
                },
                1, // 1:1 aspect ratio
                width,
                height
            ),
            width,
            height
        );
        setCrop(crop);
    }

    const getCroppedImg = () => {
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        if (!image || !crop || !crop.width || !crop.height) {
            return;
        }
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        const pixelRatio = window.devicePixelRatio;
        canvas.width = crop.width * pixelRatio;
        canvas.height = crop.height * pixelRatio;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        const base64Image = canvas.toDataURL('image/png');
        onCropComplete(base64Image);
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Crop Image</AlertDialogTitle>
                    <AlertDialogDescription>
                        Select the area of the image you want to use as the profile picture.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-center">
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1}>
                        <img ref={imgRef} src={imgSrc} alt="Source" onLoad={onImageLoad} />
                    </ReactCrop>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button onClick={getCroppedImg} disabled={!crop?.width || !crop?.height}>Crop</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
