        // renderClock(context: CanvasRenderingContext2D) {
        //     context.drawImage(SplitTime.image.get("clock.png"), SplitTime.SCREENX - 140, 0);
        //     context.lineWidth = 1;
        //     context.strokeStyle = "#DDDDDD";
        //     var hand = Math.PI / 2 - (2 * (this.clockSeconds / 60) * Math.PI);
        //     context.beginPath();
        //     context.moveTo(SplitTime.SCREENX - 70, 70);
        //     context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
        //     context.stroke();
        //     context.lineWidth = 2;
        //     context.strokeStyle = "#000000";
        //     hand = Math.PI / 2 - (2 * (this.clockMinutes / 60) * Math.PI);
        //     context.beginPath();
        //     context.moveTo(SplitTime.SCREENX - 70, 70);
        //     context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
        //     context.stroke();
        //     context.strokeStyle = "#EE0000";
        //     context.lineWidth = 3;
        //     hand = Math.PI / 2 - (2 * (this.clockHours / 12) * Math.PI);
        //     context.beginPath();
        //     context.moveTo(SplitTime.SCREENX - 70, 70);
        //     context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
        //     context.stroke();
        // };