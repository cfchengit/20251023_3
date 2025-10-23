// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵修正：根據分數啟動或停止連續繪製 (loop/noLoop)
        // ----------------------------------------
        let percentage = (finalScore / maxScore) * 100;
        
        if (percentage >= 90) {
            loop(); // 90分以上，開始循環繪製 (以運行煙火動畫)
        } else {
            noLoop(); // 低於 90分，停止循環繪製 (只繪製一次靜態畫面)
            redraw(); // 確保靜態畫面更新
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

// === 煙火相關的全局變數和類別 ===
let fireworks = []; // 儲存所有的煙火實例
let gravity;        // 重力向量

// Particle 類別：構成煙火爆炸後的每一個點
class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; 
        this.lifespan = 255;
        this.hue = hue;
        
        if (this.firework) {
            // 火箭向上發射
            this.vel = createVector(0, random(-10, -18));
        } else {
            // 爆炸碎片向隨機方向發散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 隨機速度
        }
        this.acc = createVector(0, 0); // 加速度
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9); // 爆炸後逐漸減速
            this.lifespan -= 4; // 壽命減少 (淡出效果)
        }
        
        this.applyForce(gravity); // 施加重力
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    show() {
        if (!this.firework) {
            // 爆炸粒子：顯示為小點
            strokeWeight(2);
            stroke(this.hue, 100, 100, this.lifespan / 255); // 使用 HSB 顏色
        } else {
            // 火箭：顯示為大一點的點
            strokeWeight(4);
            stroke(this.hue, 100, 100);
        }
        point(this.pos.x, this.pos.y);
    }
    
    // 檢查粒子是否應該被移除
    isDead() {
        return this.lifespan < 0;
    }
}

// Firework 類別：管理單個煙火從發射到爆炸的生命週期
class Firework {
    constructor() {
        // 煙火的顏色
        this.hue = random(360); 
        // 初始粒子 (火箭)
        this.firework = new Particle(random(width), height, this.hue, true); 
        this.exploded = false;
        this.particles = []; // 爆炸後的碎片
    }
    
    explode() {
        for (let i = 0; i < 100; i++) {
            // 爆炸產生 100 個碎片
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hue, false);
            this.particles.push(p);
        }
    }

    update() {
        if (!this.exploded) {
            this.firework.update();
            // 檢查火箭是否達到最高點 (速度向上變為向下)
            if (this.firework.vel.y >= 0) { 
                this.exploded = true;
                this.explode();
            }
        } else {
            // 更新爆炸碎片
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].isDead()) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        } else {
            for (let p of this.particles) {
                p.show();
            }
        }
    }
    
    // 檢查煙火是否完全結束 (所有爆炸粒子都消失)
    done() {
        return this.exploded && this.particles.length === 0;
    }
}


function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 啟用 HSB 色彩模式
    colorMode(HSB, 360, 100, 100, 1); 
    // 設定重力
    gravity = createVector(0, 0.2); 
    // 初始背景為全黑
    background(0); 
    // 初始不循環繪製，等待分數觸發
    noLoop(); 
} 

function draw() { 
    // 關鍵修正：使用半透明的黑色背景，製造拖影效果 (Trail Effect)
    background(0, 0, 0, 0.2); 

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    // --- 煙火邏輯 ---
    if (percentage >= 90) {
        // 高分時，隨機產生新煙火
        // 每 10 幀有 10% 的機率發射新煙火
        if (frameCount % 10 === 0 && random(1) < 0.1) {
            fireworks.push(new Firework());
        }
    }
    
    // 更新並顯示所有煙火
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        // 移除已結束的煙火
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
    // ----------------------
    
    // 畫面中央的文字與幾何圖形顯示 
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(255); // 為了讓文字在黑色背景上可見，改為白色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 4, height - 100, 100); 
        
    } else if (percentage >= 60) {
        // 畫一個方形
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height - 100, 100, 100); 
    }
    
}
