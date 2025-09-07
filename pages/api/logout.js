export default async (req, res) => {
    res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=-1');
    return res.status(200).json({ ok: true });
};
