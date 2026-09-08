const { OpenAI } = require('openai');
const PDFDocument = require('pdfkit');
const stream = require('stream');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cv, offerta } = req.body;

  if (!cv || !offerta) {
    return res.status(400).json({ error: 'CV and offerta are required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Sei un esperto di HR. Analizza il CV e l\'offerta di lavoro. Restituisci: 1) punteggio di match (0-100), 2) parole chiave mancanti, 3) riscrittura del profilo "Chi sono", 4) 3 domande che faranno al colloquio.' },
        { role: 'user', content: `CV: ${cv}\nOfferta: ${offerta}` }
      ],
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;

    const pdfStream = new stream.PassThrough();
    const doc = new PDFDocument();
    doc.pipe(pdfStream);

    doc.fontSize(18).text('Report di Match CV', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(result, { align: 'left' });
    doc.end();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    pdfStream.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante la generazione del report' });
  }
};