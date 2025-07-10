class Layout {
    
    /**
     * Constructor
     */
    constructor()
    {
        this.history = [];
    }
    
    
    /**
     * Send message
     */
    sendMessage(message)
    {
        this.history.push(message);
    }
};

export default Layout;