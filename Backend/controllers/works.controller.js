const db = require('./../models');
const Works = db.works

// 🔧 FONCTION HELPER POUR OBTENIR LA BONNE URL DE BASE
const getBaseUrl = (req) => {
	if (process.env.NODE_ENV === 'production') {
		return 'https://sophiebluel-production-c545.up.railway.app';
	}
	return `${req.protocol}://${req.get('host')}`;
};

exports.findAll = async (req, res) => {
	const works = await Works.findAll({ include: 'category' });

	// 🔧 CORRIGER LES URLs EXISTANTES
	const baseUrl = getBaseUrl(req);
	const worksWithCorrectUrls = works.map(work => {
		const workData = work.toJSON();
		return {
			...workData,
			imageUrl: workData.imageUrl.replace('http://localhost:5678', baseUrl)
		};
	});

	return res.status(200).json(worksWithCorrectUrls);
}

exports.create = async (req, res) => {
	// 🔧 UTILISER LA FONCTION HELPER
	const baseUrl = getBaseUrl(req);
	const title = req.body.title;
	const categoryId = req.body.category;
	const userId = req.auth.userId;
	const imageUrl = `${baseUrl}/images/${req.file.filename}`;

	try {
		const work = await Works.create({
			title,
			imageUrl,
			categoryId,
			userId
		})
		return res.status(201).json(work)
	} catch (err) {
		return res.status(500).json({ error: new Error('Something went wrong') })
	}
}

exports.delete = async (req, res) => {
	try {
		await Works.destroy({ where: { id: req.params.id } })
		return res.status(204).json({ message: 'Work Deleted Successfully' })
	} catch (e) {
		return res.status(500).json({ error: new Error('Something went wrong') })
	}
}