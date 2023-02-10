import { MutableRefObject } from 'react';
// import { HAND_CONNECTIONS } from '@mediapipe/holistic';
// import { Hands, HandsConfig } from '@mediapipe/hands';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { detectContentType } from 'next/dist/server/image-optimizer';



export async function startRecognition(videoRef: MutableRefObject<any>, callback: Function) {
    setTimeout(async () => {
        console.log('start recognition', videoRef);


        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
            runtime: "mediapipe", // or 'tfjs',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',  
            modelType: 'full'
        }
        const detector = await handPoseDetection.createDetector(model, detectorConfig);
        
        setInterval(() => detect(detector, videoRef, callback), 1000);
    }, 5000)
  }


async function detect(detector: any, videoRef: MutableRefObject<any>, callback: Function){
    try{
    const hands = await detector.estimateHands(videoRef.current, {flipHorizontal: false});

    const fingers = hands[0]?.keypoints3D;

    function p(fingerNumber: number, coordinate: any){
        return fingers[fingerNumber][coordinate];
    }

    if(fingers){
        const thump_above_wrist = p(4, "y") < p(3, "y") && p(3, "y") < p(0, "y");
		const thump_below_wrist = p(4, "y") > p(3, "y") && p(3, "y") > p(0, "y");
        const hand_not_flat = Math.abs(p(4, "y") - p(3, "y")) <  Math.abs(p(3, "y") - p(0, "y"));
        const is_right_hand = hands[0].handedness == "Left";
        const is_right_hand_folded = p(8,"x") < p(6,"x") && p(12,"x") < p(10, "x") && p(16,"x") < p(14, "x") && p(20,"x") < p(18, "x");
        const is_left_hand_folded = p(6,"x") < p(8,"x") && p(10,"x") < p(12, "x") && p(14,"x") < p(16, "x") && p(18,"x") < p(20, "x");
		
		const is_only_index_finger_pointing = p(8, "y") < p(7, "y") && p(12, "y") > p(9, "y") && p(16, "y") > p(13, "y") && p(20, "y") > p(17, "y") ;
		
		const is_right_hand_ordered = p(4,"x") < p(8,"x") && p(8,"x") < p(12, "x") && p(12,"x") < p(16, "x") && p(16,"x") < p(20, "x");
		const is_left_hand_ordered = p(4,"x") > p(8,"x") && p(8,"x") > p(12, "x") && p(12,"x") > p(16, "x") && p(16,"x") > p(20, "x");
		
		const are_fingers_straight = p(8, "y") < p(7, "y") && p(12, "y") < p(9, "y") && p(16, "y") < p(13, "y") && p(20, "y") < p(17, "y") ;
		
		const german_1 = p(12, "y") < p(11, "y") && p(8, "y") > p(7, "y") && p(16, "y") > p(15, "y") && p(20, "y") > p(19, "y") ;

        console.log(german_1);

        
        const fingers_folded = is_right_hand ? is_right_hand_folded : is_left_hand_folded;
		const fingers_reverse_folded = is_right_hand ? is_right_hand_folded :  is_left_hand_folded;
		const fingers_ordered = is_right_hand ? is_left_hand_ordered : is_right_hand_ordered;

        const thump_up = (p(4, "x") - p(3, "x")) < 0.011 && (p(3, "x") - p(4, "x")) < 0.011;
		

        if( thump_above_wrist && hand_not_flat && fingers_folded && thump_up){
            console.log("Thumps up! (sort of)");
            callback({detected_hand_gesture: "thumps_up"});
        }else{
		
			if(thump_below_wrist && hand_not_flat && fingers_reverse_folded && thump_up){
				console.log("Thumps down! (sort of)");
				callback({detected_hand_gesture: "thump_down"});
			}else{
				console.log("Thumps up :(");
				if (is_only_index_finger_pointing || (fingers_ordered && are_fingers_straight)){
						console.log("Hand raised!");
						callback({detected_hand_gesture: "hand_raised"});
				
				}else{
					if(german_1){
						console.log("German!!!");
						callback({detected_hand_gesture: "german"});
					}else {
					callback({detected_hand_gesture: "nothing"});
					}
				}
			}
        }

    }else{
        console.log("No hand");
        callback({detected_hand_gesture: "nothing"});
    }
}catch(e){
    console.log(e);
}

}


    
    // const config = {locateFile: (file: string) => {
    //     return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}/${file}`;
    //   }};    
    //   const hands = new Hands(config);
    //   console.log("hierzo!");
    // hands.onResults(onResults);
    // console.log("hierzo! next");

// console.log(HAND_CONNECTIONS);

//     const model = handPoseDetection.SupportedModels.MediaPipeHands;
// const detectorConfig = {
//   runtime: 'mediapipe', // or 'tfjs',
//   solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
//   modelType: 'full'
// }
// const detector = await handPoseDetection.createDetector(model, detectorConfig);
// }



// function onResults(results: any): void {
//     console.log(results);

//     if(results.multiHandLandmarks && results.multiHandedness){
//         console.log("MULTI HANDS!");
//     }


    // // Hide the spinner.
    // document.body.classList.add('loaded');
  
    // // Update the frame rate.
    // fpsControl.tick();
  
    // // Draw the overlays.
    // canvasCtx.save();
    // canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // canvasCtx.drawImage(
    //     results.image, 0, 0, canvasElement.width, canvasElement.height);
    // if (results.multiHandLandmarks && results.multiHandedness) {
    //   for (let index = 0; index < results.multiHandLandmarks.length; index++) {
    //     const classification = results.multiHandedness[index];
    //     const isRightHand = classification.label === 'Right';
    //     const landmarks = results.multiHandLandmarks[index];
    //     drawingUtils.drawConnectors(
    //         canvasCtx, landmarks, mpHands.HAND_CONNECTIONS,
    //         {color: isRightHand ? '#00FF00' : '#FF0000'});
    //     drawingUtils.drawLandmarks(canvasCtx, landmarks, {
    //       color: isRightHand ? '#00FF00' : '#FF0000',
    //       fillColor: isRightHand ? '#FF0000' : '#00FF00',
    //       radius: (data: drawingUtils.Data) => {
    //         return drawingUtils.lerp(data.from!.z!, -0.15, .1, 10, 1);
    //       }
    //     });
    //   }
    // }
    // canvasCtx.restore();
  
    // if (results.multiHandWorldLandmarks) {
    //   // We only get to call updateLandmarks once, so we need to cook the data to
    //   // fit. The landmarks just merge, but the connections need to be offset.
    //   const landmarks = results.multiHandWorldLandmarks.reduce(
    //       (prev, current) => [...prev, ...current], []);
    //   const colors = [];
    //   let connections: mpHands.LandmarkConnectionArray = [];
    //   for (let loop = 0; loop < results.multiHandWorldLandmarks.length; ++loop) {
    //     const offset = loop * mpHands.HAND_CONNECTIONS.length;
    //     const offsetConnections =
    //         mpHands.HAND_CONNECTIONS.map(
    //             (connection) =>
    //                 [connection[0] + offset, connection[1] + offset]) as
    //         mpHands.LandmarkConnectionArray;
    //     connections = connections.concat(offsetConnections);
    //     const classification = results.multiHandedness[loop];
    //     colors.push({
    //       list: offsetConnections.map((unused, i) => i + offset),
    //       color: classification.label,
    //     });
    //   }
    //   grid.updateLandmarks(landmarks, connections, colors);
    // } else {
    //   grid.updateLandmarks([]);
    // }
//   }
