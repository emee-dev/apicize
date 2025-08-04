import React from "react";

export default function useWindowSize() {
    const [windowSize, setWindowSize] = React.useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    function changeWindowSize() {
        console.log(`changeWindowSize ${window.innerWidth} x ${window.innerHeight}`)
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    React.useEffect(() => {
        window.addEventListener("resize", changeWindowSize);

        return () => {
            window.removeEventListener("resize", changeWindowSize);
        };
    }, []);

    return windowSize;
}