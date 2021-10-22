class Logger {
    constructor(logConfig) {
        this.config = logConfig;
    }

    publish = async (data) => {
        if (this.config.enabled) {
            if (this.config.outputs?.console) {
                console.log(data);
            }
        }
    }
}

module.exports = Logger;