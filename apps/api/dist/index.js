"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const guidelines_1 = __importDefault(require("./routes/guidelines"));
const facts_1 = __importDefault(require("./routes/facts"));
const bannedTerms_1 = __importDefault(require("./routes/bannedTerms"));
const contents_1 = __importDefault(require("./routes/contents"));
const comments_1 = __importDefault(require("./routes/comments"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const issues_1 = __importDefault(require("./routes/issues"));
const approvals_1 = __importDefault(require("./routes/approvals"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const auditLogs_1 = __importDefault(require("./routes/auditLogs"));
const accessibility_1 = __importDefault(require("./routes/accessibility"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true
}));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Inkloom AI Backend API',
        timestamp: new Date().toISOString()
    });
});
// Routes
app.use('/auth', auth_1.default);
app.use('/users', users_1.default);
app.use('/guidelines', guidelines_1.default);
app.use('/facts', facts_1.default);
app.use('/banned-terms', bannedTerms_1.default);
app.use('/contents', contents_1.default);
app.use('/contents', comments_1.default);
app.use('/reviews', reviews_1.default);
app.use('/issues', issues_1.default);
app.use('/approvals', approvals_1.default);
app.use('/analytics', analytics_1.default);
app.use('/audit-logs', auditLogs_1.default);
app.use('/accessibility', accessibility_1.default);
// Error Handler
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        await (0, db_1.initDb)();
        app.listen(PORT, () => {
            console.log(`[Inkloom API] Server listening on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('[Inkloom API] Startup failure:', err);
        process.exit(1);
    }
}
startServer();
